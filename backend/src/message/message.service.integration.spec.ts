import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { DynamodbModule } from '../dynamodb/dynamodb.module';
import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import Message from 'src/domain/Message';

describe('MessageServiceIntegration', () => {
  let service: MessageService;
  const dynamo = new DynamoDBClient({
    endpoint: process.env.DYNAMO_URL,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageService],
      imports: [DynamodbModule],
    }).compile();

    service = module.get<MessageService>(MessageService);

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
  });

  it('should fetch newly added messages in order of timestamp_utc largest to smallest', async () => {
    // Arrange
    const messages: Message[] = [
      { chatid: 'a:b', timestamp_utc: 1, text: 'Hello friend', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 10, text: 'Hello friend!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 2, text: 'Hello friend!!', from: 'a' },
    ];
    const expected: Message[] = [
      { chatid: 'a:b', timestamp_utc: 10, text: 'Hello friend!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 2, text: 'Hello friend!!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 1, text: 'Hello friend', from: 'a' },
    ];

    // Act
    await service.sendMessage(
      'a',
      'b',
      messages[0].timestamp_utc,
      messages[0].text,
    );
    await service.sendMessage(
      'a',
      'b',
      messages[1].timestamp_utc,
      messages[1].text,
    );
    await service.sendMessage(
      'a',
      'b',
      messages[2].timestamp_utc,
      messages[2].text,
    );
    const result = await service.getMessages('a', 'b');

    // Assert
    expect(result).toStrictEqual(expected);
  });

  it('should only fetch messages between the requested users', async () => {
    // Arrange
    const messages: Message[] = [
      { chatid: 'a:b', timestamp_utc: 1, text: 'Hello friend', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 10, text: 'Hello friend!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 2, text: 'Hello friend!!', from: 'a' },
      {
        chatid: 'a:c',
        timestamp_utc: 11,
        text: "Shouldn't return!",
        from: 'c',
      },
    ];
    const expected: Message[] = [
      { chatid: 'a:b', timestamp_utc: 10, text: 'Hello friend!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 2, text: 'Hello friend!!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 1, text: 'Hello friend', from: 'a' },
    ];

    // Act
    await service.sendMessage(
      'a',
      'b',
      messages[0].timestamp_utc,
      messages[0].text,
    );
    await service.sendMessage(
      'a',
      'b',
      messages[1].timestamp_utc,
      messages[1].text,
    );
    await service.sendMessage(
      'a',
      'b',
      messages[2].timestamp_utc,
      messages[2].text,
    );
    await service.sendMessage(
      'c',
      'a',
      messages[3].timestamp_utc,
      messages[3].text,
    );
    const result = await service.getMessages('a', 'b');

    // Assert
    expect(result).toStrictEqual(expected);
  });

  it('should only fetch messages before provided cursor', async () => {
    // Arrange
    const messages: Message[] = [
      { chatid: 'a:b', timestamp_utc: 1, text: 'Hello friend', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 10, text: 'Hello friend!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 2, text: 'Hello friend!!', from: 'a' },
      {
        chatid: 'a:c',
        timestamp_utc: 11,
        text: "Shouldn't return!",
        from: 'c',
      },
    ];
    const expected: Message[] = [
      // timestamp_utc 10 is omitted because we will provide this as our cursor
      { chatid: 'a:b', timestamp_utc: 2, text: 'Hello friend!!', from: 'a' },
      { chatid: 'a:b', timestamp_utc: 1, text: 'Hello friend', from: 'a' },
    ];

    // Act
    await service.sendMessage(
      'a',
      'b',
      messages[0].timestamp_utc,
      messages[0].text,
    );
    await service.sendMessage(
      'a',
      'b',
      messages[1].timestamp_utc,
      messages[1].text,
    );
    await service.sendMessage(
      'a',
      'b',
      messages[2].timestamp_utc,
      messages[2].text,
    );
    await service.sendMessage(
      'c',
      'a',
      messages[3].timestamp_utc,
      messages[3].text,
    );
    const result = await service.getMessages('a', 'b', 10);

    // Assert
    expect(result).toStrictEqual(expected);
  });

  it('should only fetch 20 most recent messages before a cursor', async () => {
    // Arrange
    const fromId = 'a';
    const chatId = 'a:b';
    const text = 'hello';

    const expected: Message[] = [];
    // Posts from timestamp 20 down to 1 inclusive
    for (let i = 20; i >= 1; i--) {
      expected.push({
        chatid: chatId,
        from: fromId,
        text: text,
        timestamp_utc: i,
      });
    }

    // Act (send 25 messages, get the ones before 21)
    for (let i = 0; i < 25; i++) {
      await service.sendMessage('a', 'b', i, text);
    }
    const result = await service.getMessages('a', 'b', 21);

    // Assert
    expect(result).toStrictEqual(expected);
  });
});
