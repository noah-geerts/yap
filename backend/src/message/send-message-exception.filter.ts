import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import MessageStatusDto from '../domain/MessageStatusDto';
import SendMessageDto from '../domain/SendMessageDto';

@Catch()
export class SendMessageExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SendMessageExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    const data: SendMessageDto = ctx.getData();

    const payload: MessageStatusDto =
      exception instanceof WsException // This means some data validation went wrong
        ? {
            message: data,
            success: false,
            errorMessage: JSON.stringify(exception.getError(), null, 2),
          }
        : {
            // This is some other internal server error
            message: data,
            success: false,
            errorMessage: exception?.message ?? 'Internal server error',
          };

    this.logger.error(
      'sendMessage websocket event exception:',
      payload,
      exception?.stack,
    );
    try {
      if (client && client.emit) {
        // emit a stable event the frontend can listen for
        client.emit('messageStatus', payload);
      }
    } catch (e) {
      this.logger.error('Failed to emit ws-error', e);
    }
  }
}
