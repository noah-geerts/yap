export default class Auth0Payload {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  gty?: string;
  azp?: string;
}
