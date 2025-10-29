import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import Message from '../src/domain/Message';
import { getChatId, MessageService } from '../src/message/message.service';
import { marshall } from '@aws-sdk/util-dynamodb';
import { io } from 'socket.io-client';
import SendMessageDto from 'src/domain/SendMessageDto';
import MessageStatusDto from 'src/domain/MessageStatusDto';
import NewMessageDto from 'src/domain/NewMessageDto';

// Fetches a legitimate jwt from the auth0 server for testing auth guards
async function getToken() {
  try {
    const response = await fetch(
      'https://dev-h60bzgedqbu866oj.us.auth0.com/oauth/token',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: 'http://localhost:3000',
          grant_type: 'client_credentials',
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token:', error);
  }
}

describe('MessageController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  const dynamo = new DynamoDBClient({
    endpoint: process.env.DYNAMO_URL,
  });
  const testWithId = 'testuser2';
  const testText = 'hello';
  const seededMessages: Message[] = [];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeAll(async () => {
    // Delete the table
    await dynamo.send(new DeleteTableCommand({ TableName: 'messages' }));

    // Create the table for testing
    await dynamo.send(
      new CreateTableCommand({
        TableName: 'messages',
        AttributeDefinitions: [
          { AttributeName: 'chatid', AttributeType: 'S' },
          { AttributeName: 'timestamp_utc', AttributeType: 'N' },
        ],
        KeySchema: [
          { AttributeName: 'chatid', KeyType: 'HASH' }, // partition key
          { AttributeName: 'timestamp_utc', KeyType: 'RANGE' }, // sort key
        ],
        BillingMode: 'PAY_PER_REQUEST',
        TableClass: 'STANDARD',
      }),
    );

    const tokenObject = await getToken();
    token = tokenObject.access_token;
    const tokenSub = process.env.AUTH0_CLIENT_ID + '@clients';

    // Seed some messages
    for (let i = 2; i >= 0; i--) {
      const message: Message = {
        from: tokenSub,
        chatid: getChatId(tokenSub, testWithId),
        timestamp_utc: i,
        text: testText,
      };

      seededMessages.push(message);

      await dynamo.send(
        new PutItemCommand({ TableName: 'messages', Item: marshall(message) }),
      );
    }
  });

  it('GET /messages should return unauthorized when no jwt provided', () => {
    return request(app.getHttpServer()).get('/messages/testid').expect(401);
  });

  it('GET /messages should return an empty array for nonexistent conversation with no cursor', () => {
    // test-user has no chats with test-id
    return request(app.getHttpServer())
      .get('/messages/testid')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect([]);
  });

  it('GET /messages should return an empty array for nonexistent conversation with cursor', () => {
    // test-user has no chats with test-id
    return request(app.getHttpServer())
      .get('/messages/testid?lastReceivedTimestamp=0')
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect([]);
  });

  it('GET /messages should return an not found with no withId', () => {
    return request(app.getHttpServer())
      .get('/messages')
      .set('Authorization', 'Bearer ' + token)
      .expect(404);
  });

  it('GET /messages should return the recent messages from a conversation', () => {
    // Arrange
    let a = 3;

    // Act & Assert
    return request(app.getHttpServer())
      .get('/messages/' + testWithId)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect(seededMessages);
  });
});

describe('MessageGateway (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  const dynamo = new DynamoDBClient({
    endpoint: process.env.DYNAMO_URL,
  });
  const gatewayUrl = 'http://localhost:3000/';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeAll(async () => {
    // Delete the table
    await dynamo.send(new DeleteTableCommand({ TableName: 'messages' }));

    // Create the table for testing
    await dynamo.send(
      new CreateTableCommand({
        TableName: 'messages',
        AttributeDefinitions: [
          { AttributeName: 'chatid', AttributeType: 'S' },
          { AttributeName: 'timestamp_utc', AttributeType: 'N' },
        ],
        KeySchema: [
          { AttributeName: 'chatid', KeyType: 'HASH' }, // partition key
          { AttributeName: 'timestamp_utc', KeyType: 'RANGE' }, // sort key
        ],
        BillingMode: 'PAY_PER_REQUEST',
        TableClass: 'STANDARD',
      }),
    );

    const tokenObject = await getToken();
    token = tokenObject.access_token;
  });

  it('should deny connection to unauthorized handshakes', (done) => {
    const socket = io(gatewayUrl);

    const timeout = setTimeout(() => {
      done(new Error('Socket was not disconnected in time'));
    }, 500); // fail if not disconnected within 500ms

    socket.on('disconnect', (reason) => {
      console.log('DISCONNECTING');
      expect(reason).toBe('io server disconnect'); // server forced
      clearTimeout(timeout);
      done();
    });
  });

  it('should allow connection to authorized handshakes', (done) => {
    const socket = io(gatewayUrl, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    const timeout = setTimeout(() => {
      done();
    }, 500); // pass if still connected after 500ms

    socket.on('disconnect', (reason) => {
      console.log('DISCONNECTING');
      clearTimeout(timeout);
      fail('Socket disconnected despite providing auth header');
    });

    socket.on('connection_error', (reason) => {
      clearTimeout(timeout);
      fail('Unexpected connection error occured');
    });
  });

  const testcases: {
    toId: string | number;
    timestamp_utc: string | number;
    text: string | number;
  }[] = [
    { toId: '', timestamp_utc: 10, text: 'HI' }, // recipient can't be empty
    { toId: 0, timestamp_utc: 10, text: 'HI' }, // recipient must be a string
    { toId: 'recipient', timestamp_utc: 'notanint', text: 'HI' }, // timestamp can't be a string
    { toId: 'recipient', timestamp_utc: 10, text: '' }, // text can't be empty
    { toId: 'recipient', timestamp_utc: 10, text: 0 }, // text must be a string
  ];

  test.each(testcases)(
    'should return failed messageStatus event for malformed sendMessage events',
    async ({ toId, timestamp_utc, text }) => {
      // return a Promise so Jest waits properly
      await new Promise<void>((resolve, reject) => {
        // Connect to the server
        const socket = io(gatewayUrl, {
          extraHeaders: { Authorization: `Bearer ${token}` },
        });

        // Fail test on disconnection or connection error
        socket.on('disconnect', () =>
          reject('Socket disconnected unexpectedly'),
        );
        socket.on('connect_error', (err) =>
          reject(`Unexpected connection error: ${err}`),
        );

        // Emit sendMessage event on connect
        socket.on('connect', () => {
          socket.emit('sendMessage', { toId, timestamp_utc, text });
        });

        // Ensure messageStatus event is received. Ensure failed messageStatus due to malformed sendMessage body
        socket.on('messageStatus', (status) => {
          try {
            expect(status.success).toBe(false);
            expect(status.errorMessage).toBeTruthy();
            expect(status.message).toStrictEqual({ toId, timestamp_utc, text });
            resolve(); // Resolve promise to indicate test passing
          } catch (err) {
            reject(err);
          }
        });
      });
    },
  );

  it('should send messageStatus, newMessage, and update db on well-formed sendMessage', async () => {
    const thisUser = process.env.AUTH0_CLIENT_ID + '@clients';
    await new Promise<void>((resolve, reject) => {
      // Connect to the gateway
      const socket = io(gatewayUrl, {
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fail test (reject promise) on disconnection or connection error
      socket.on('disconnect', (reason) => {
        reject('Socket disconnected unexpectedly');
      });

      socket.on('connection_error', (reason) => {
        reject('Unexpected connection error occured');
      });

      // Send the sendMessage event upon connecting to the websocket
      socket.on('connect', () => {
        socket.emit('sendMessage', sendMessageDto);
      });

      // Function to resolve promise (pass test) on successful events
      let receivedMessageStatus = false;
      let receivedNewMessage = false;
      function doesPass(a: boolean, b: boolean) {
        if (a && b) {
          resolve();
        }
      }

      // Assert that message status is successful
      const sendMessageDto: SendMessageDto = {
        toId: thisUser,
        timestamp_utc: 1,
        text: 'hello',
      };
      socket.on('messageStatus', (status: MessageStatusDto) => {
        receivedMessageStatus = true;
        doesPass(receivedMessageStatus, receivedNewMessage);
        expect(status.success).toBe(true);
        expect(status.errorMessage).toBeUndefined();
        expect(status.message).toStrictEqual(sendMessageDto);
      });

      // Assert that the recipient gets the new message event with the new message
      const expectedNewMessage: NewMessageDto = {
        fromId: thisUser,
        timestamp_utc: 1,
        text: 'hello',
      };
      socket.on('newMessage', (newMessage: MessageStatusDto) => {
        receivedNewMessage = true;
        doesPass(receivedMessageStatus, receivedNewMessage);
        expect(newMessage).toStrictEqual(expectedNewMessage);
      });
    });

    // Assert that the db was updated successfully
    const expectedMessages: Message[] = [
      {
        chatid: thisUser + ':' + thisUser,
        timestamp_utc: 1,
        text: 'hello',
        from: thisUser,
      },
    ];
    const messageService = app.get(MessageService);
    const myMessages: Message[] = await messageService.getMessages(
      thisUser,
      thisUser,
    );
    expect(myMessages).toStrictEqual(expectedMessages);
  });
});
