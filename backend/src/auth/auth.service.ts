import { Injectable } from '@nestjs/common';
import Auth0Payload from '../domain/Auth0Payload';

// Custom Authentication service that uses the jose library to retrieve the key set from our
// authentication provider (Auth0) and verify jwt's using this key set
@Injectable()
export class AuthService {
  JWKS: any;

  // Verifies a jwt using the remote keypair from auth0
  async verifyToken(jwt: string) {
    const { jwtVerify, createRemoteJWKSet, errors } = await import('jose');

    if (this.JWKS === undefined) {
      this.JWKS = createRemoteJWKSet(
        new URL(`${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`),
      );
    }

    const [encodedHeader] = jwt.split('.');
    const headerJson = Buffer.from(encodedHeader, 'base64url').toString();

    const options = {
      issuer: process.env.AUTH0_ISSUER_URL,
      audience: process.env.AUTH0_AUDIENCE,
    };

    const { payload, protectedHeader } = await jwtVerify<Auth0Payload>(
      jwt,
      this.JWKS,
      options,
    ).catch(async (error) => {
      if (error?.code === 'ERR_JWKS_MULTIPLE_MATCHING_KEYS') {
        for await (const publicKey of error) {
          try {
            return await jwtVerify<Auth0Payload>(jwt, publicKey, options);
          } catch (innerError) {
            if (innerError?.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
              continue;
            }
            throw innerError;
          }
        }
        throw new errors.JWSSignatureVerificationFailed();
      }

      throw error;
    });
    return payload as Auth0Payload;
  }
}
