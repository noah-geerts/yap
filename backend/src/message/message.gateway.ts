import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import SendMessageDto from '../domain/SendMessageDto';
import { SendMessageExceptionFilter } from './send-message-exception.filter';
import { MessageService } from './message.service';
import MessageStatusDto from '../domain/MessageStatusDto';
import Auth0Payload from '../auth/jwt-payload';
import NewMessageDto from '../domain/NewMessageDto';

@WebSocketGateway({ cors: true })
export class MessageGateway implements OnGatewayConnection {
  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
  ) {}

  @WebSocketServer()
  server: Server;

  // Authorization upon new connection. Disconnect if unauthorized
  async handleConnection(client: Socket) {
    console.log('client connecting');
    try {
      const authHeader = client.handshake.headers.authorization;
      if (!authHeader) {
        throw new Error('No authorization header provided. Disconnecting.');
      }
      const jwt = authHeader.split(' ')[1];
      const payload = await this.authService.verifyToken(jwt);
      client.data.user = payload;
    } catch (e) {
      console.log(e);
      client.disconnect(true); // unauthorized
    }
  }

  // Event the client uses to send new messages
  @SubscribeMessage('sendMessage')
  @UseFilters(SendMessageExceptionFilter)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new WsException(errors),
    }),
  )
  async handleMessage(
    @MessageBody() sendMessageDto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Persist the new message using messageService
    console.log(client.data.user.sub, 'sending a message');
    await this.messageService.sendMessage(
      client.data.user.sub,
      sendMessageDto.toId,
      sendMessageDto.timestamp_utc,
      sendMessageDto.text,
    );

    // If nothing went wrong (no exceptions thrown above)
    // send a success status so to the sender
    console.log('EMITTING STATUS EVENT BACK TO CLIENT');
    const status: MessageStatusDto = {
      message: sendMessageDto,
      success: true,
    };
    client.emit('messageStatus', status);

    // And send a new message event to all sockets with uid toId
    const message: NewMessageDto = {
      fromId: client.data.user.sub,
      timestamp_utc: sendMessageDto.timestamp_utc,
      text: sendMessageDto.text,
    };
    for (const [id, socket] of this.server.sockets.sockets) {
      const authPayload: Auth0Payload = socket.data.user;
      if (authPayload.sub === sendMessageDto.toId) {
        socket.emit('newMessage', message);
      }
    }
  }
}
