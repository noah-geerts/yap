// Dependencies
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

// Src
import { AppModule } from '../src/app.module';
import Message from '../src/domain/Message';
import { getChatId } from '../src/message/service/message.service';

// Testing helpers
import { getToken } from './e2e-helper';

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
