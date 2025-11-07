import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import Auth0Payload from '../domain/Auth0Payload';

// Extracts user information from request and injects it into a route param
// to be used in controller routes
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as Auth0Payload; // the decoded JWT payload
  },
);
