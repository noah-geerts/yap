import { createRemoteJWKSet, jwtVerify } from "jose";
import { Payload } from "../domain/Payload.js";

const JWKS = createRemoteJWKSet(
  new URL("https://dev-h60bzgedqbu866oj.us.auth0.com/.well-known/jwks.json")
);

// Tries to verify the token and return the payload using the remote keyset. If it fails it will throw a JOSEError
export async function verifyJwt(jwt: string) {
  const verificationResult = await jwtVerify<Payload>(jwt, JWKS, {
    issuer: "https://dev-h60bzgedqbu866oj.us.auth0.com/",
    audience: "http://localhost:3000",
  });
  return verificationResult.payload;
}
