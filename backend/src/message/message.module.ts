import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { DynamodbModule } from '../dynamodb/dynamodb.module';
import { AuthModule } from '../auth/auth.module';
import { MessageGateway } from './message.gateway';

@Module({
  providers: [MessageService, MessageGateway],
  controllers: [MessageController],
  imports: [DynamodbModule, AuthModule],
})
export class MessageModule {}
