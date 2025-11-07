// Dependencies
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { io } from 'socket.io-client';

// Src
import { AppModule } from '../src/app.module';
import Message from '../src/domain/Message';
import { MessageService } from '../src/message/service/message.service';
import SendMessageDto from 'src/domain/SendMessageDto';
import MessageStatusDto from 'src/domain/MessageStatusDto';
import NewMessageDto from 'src/domain/NewMessageDto';

// Testing helpers
import { getToken } from './e2e-helper';

// Message Gateway tests (over Socket.io)
describe('MessageGateway (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  const dynamo = new DynamoDBClient({
    endpoint: process.env.DYNAMO_URL,
  });
  const gatewayUrl = `ws://localhost:${process.env.PORT || 3000}/`;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(process.env.PORT || 3000);
  });

  afterEach(async () => {
    if (app) await app.close();
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

  it('should deny connection to unauthorized handshakes', async () => {
    await new Promise<void>((resolve, reject) => {
      // Arrange (open connection)
      const socket = io(gatewayUrl);

      // Expect a connect_error event with the unauthorized message
      socket.on('connect_error', (err) => {
        // Our thrown message if we are upgraded, otherwise generic xhr poll error
        if (
          err.message === 'No authorization header provided' ||
          err.message === 'xhr poll error'
        ) {
          resolve();
        } else {
          reject('Wrong connect_error event received from server');
        }
      });

      // Fail if there was no connect_error within 500ms
      setTimeout(() => {
        reject('No connect_error event received');
      }, 500);
    });
  });

  it('should allow connection to authorized handshakes', async () => {
    await new Promise<void>((resolve, reject) => {
      // Arrange (open connection)
      const socket = io(gatewayUrl, {
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Expect not to get a connect_error
      socket.on('connect_error', (err) => {
        reject('error connecting');
      });

      // Pass if client received the connect event successfully
      socket.on('connect', () => {
        resolve();
      });
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

      socket.on('connect_error', (reason) => {
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
