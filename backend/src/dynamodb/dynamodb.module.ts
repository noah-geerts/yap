import { Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Module({
  providers: [
    {
      provide: DynamoDBClient,
      useFactory: () => {
        if (process.env.DYNAMO_URL === undefined) {
          throw new Error(
            `WARNING: will connect to remote aws DynamoDB instance for account with access key ID: ${process.env.AWS_ACCESS_KEY_ID}`,
          );
        }
        console.log('Connecting to DynamoDB at: ' + process.env.DYNAMO_URL);
        return new DynamoDBClient({ endpoint: process.env.DYNAMO_URL });
      },
    },
  ],
  exports: [DynamoDBClient],
})
export class DynamoDBModule {}
