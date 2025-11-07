import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';
import SendMessageDto from '../../domain/SendMessageDto';
import { SendMessageExceptionFilter } from './send-message-exception.filter';
import { MessageService } from '../service/message.service';
import MessageStatusDto from '../../domain/MessageStatusDto';
import Auth0Payload from '../../domain/Auth0Payload';
import NewMessageDto from '../../domain/NewMessageDto';

@WebSocketGateway({ cors: true })
export class MessageGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
  ) {}

  // Attach this middleware to the underlying engine.io connection to authenticate
  // any HTTP requests
  afterInit(server: Server) {
    console.log('INIT');

    server.use((socket: Socket, next) => {
      try {
        console.log('client connecting to engine.io');

        // Extract auth headers
        const authHeader = socket.handshake.headers.authorization;
        if (!authHeader) {
          return next(new Error('No authorization header provided'));
        }

        // Verify token and attach payload to socket
        const token = authHeader.split(' ')[1];
        this.authService
          .verifyToken(token)
          .then((payload) => {
            socket.data.user = payload;
            next();
          })
          .catch((err) => {
            next(new Error('Invalid token'));
          });
      } catch (err) {
        next(err);
      }
    });
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
