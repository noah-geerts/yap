import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import Auth0Payload from './jwt-payload';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Auth0Payload; // the decoded JWT payload
  },
);
