import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/user.decorator';
import Auth0Payload from '../auth/jwt-payload';

@Controller('messages')
@UseGuards(AuthGuard('jwt')) // use my authentication setup from AuthModule
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':withId')
  getAllMessages(
    @User() user: Auth0Payload,
    @Param('withId') withId: string,
    @Query('lastReceivedTimestamp')
    lastReceivedTimestamp?: string,
  ) {
    console.log('returning all messages');
    let timestampNumber: number | undefined = undefined;

    // Throw Bad Request if the optional timestamp cursor is not an int >= 0
    if (lastReceivedTimestamp) {
      timestampNumber = parseInt(lastReceivedTimestamp);
      if (Number.isNaN(timestampNumber) || timestampNumber < 0)
        throw new BadRequestException(
          'lastReceivedTimestamp must be an integer value greater than or equal to 0',
        );
    }

    return this.messageService.getMessages(user.sub, withId, timestampNumber);
  }
}
