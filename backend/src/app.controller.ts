import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from './auth/user.decorator';
import Auth0Payload from './auth/jwt-payload';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getHello(@User() user: Auth0Payload): string {
    return JSON.stringify(user, null, 2);
  }
}
