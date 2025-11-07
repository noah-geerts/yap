import { Module } from '@nestjs/common';
import { MessageService } from './service/message.service';
import { MessageController } from './controller/message.controller';
import { DynamoDBModule } from '../dynamoDB/dynamoDB.module';
import { AuthModule } from '../auth/auth.module';
import { MessageGateway } from './gateway/message.gateway';

@Module({
  providers: [MessageService, MessageGateway],
  controllers: [MessageController],
  imports: [DynamoDBModule, AuthModule],
})
export class MessageModule {}
