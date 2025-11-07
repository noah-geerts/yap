import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MessageModule } from './message/message.module';
import { DynamoDBModule } from './dynamoDB/dynamoDB.module';

@Module({
  imports: [AuthModule, MessageModule, DynamoDBModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
