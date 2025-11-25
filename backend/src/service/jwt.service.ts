import { createRemoteJWKSet, jwtVerify } from "jose";
import { Payload } from "../domain/Payload.js";

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)
);

// Tries to verify the token and return the payload using the remote keyset. If it fails it will throw a JOSEError
export async function verifyJwt(jwt: string) {
  const verificationResult = await jwtVerify<Payload>(jwt, JWKS, {
    issuer: `${process.env.AUTH0_DOMAIN}/`,
    audience: process.env.AUTH0_AUDIENCE,
  });
  return verificationResult.payload;
}
