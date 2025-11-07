import { Injectable } from '@nestjs/common';
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import Message from 'src/domain/Message';

// Local helper function to get chatId from user id's
export function getChatId(id1: string, id2: string): string {
  let a = '';
  let b = '';
  if (id1 < id2) {
    a = id1;
    b = id2;
  } else {
    a = id2;
    b = id1;
  }
  return a + ':' + b;
}

const messagesTable = 'messages';

@Injectable()
export class MessageService {
  constructor(private readonly dynamo: DynamoDBClient) {}

  // Sends a message from fromId to toId
  async sendMessage(
    fromId: string,
    toId: string,
    timestamp_utc: number,
    text: string,
  ) {
    const message: Message = {
      chatid: getChatId(fromId, toId),
      timestamp_utc: timestamp_utc,
      text: text,
      from: fromId,
    };

    await this.dynamo.send(
      new PutItemCommand({
        TableName: messagesTable,
        Item: marshall(message),
      }),
    );
  }

  // Gets messages from the given chat using cursor pagination
  async getMessages(
    id1: string,
    id2: string,
    lastReceivedTimestamp?: number,
  ): Promise<Message[]> {
    // Use cursor to get next messages if it is defined
    let keyConditionExpression = '';
    let expressionAttributeValues = {};
    if (lastReceivedTimestamp === undefined) {
      expressionAttributeValues = {
        ':chatid': { S: `${getChatId(id1, id2)}` },
      };
      keyConditionExpression = `chatid = :chatid`;
    } else {
      // timestamp_utc should be less than the last received timestamp_utc (it should be smaller: more in the past)
      expressionAttributeValues = {
        ':chatid': { S: `${getChatId(id1, id2)}` },
        ':lastReceivedTimestamp': { N: `${lastReceivedTimestamp}` },
      };
      keyConditionExpression = `chatid = :chatid AND timestamp_utc < :lastReceivedTimestamp`;
    }

    // Query DynamoDB
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: messagesTable,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ScanIndexForward: false, // Will scan from end (largest/most recent timestamp_utc) to front (smallest/least recent timestamp_utc)
        Limit: 20, // Only fetch 20 messages at a time
      }),
    );

    // Return results as Message objects
    const messages: Message[] = result.Items
      ? result.Items.map((r) => unmarshall(r) as Message)
      : [];
    return messages;
  }
}
