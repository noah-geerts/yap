import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { MessageModule } from './message/message.module';
import { DynamodbModule } from './dynamodb/dynamodb.module';

@Module({
  imports: [AuthModule, MessageModule, DynamodbModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
