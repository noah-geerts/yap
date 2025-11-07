import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import Auth0Payload from '../domain/Auth0Payload';

// Defines how Passport will authenticate requests (with Jwt in this case)
// This will be used in Nestjs controllers via Passport's AuthGuard, which uses this jwt strategy
// to authenticate requests, and then attaches the jwt payload to the request object,
// which can be accessed via the User decorator
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `${process.env.AUTH0_ISSUER_URL}`,
      algorithms: ['RS256'],
    });
  }

  // Add extra post-jwt-verification logic here if needed (such as fetching and attaching user info)
  validate(payload: Auth0Payload): Auth0Payload {
    return payload;
  }
}
