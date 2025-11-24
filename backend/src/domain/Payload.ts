export type Payload = {
  iss?: string; // Issuer
  sub?: string; // Subject (user ID)
  aud?: string | string[]; // Audience
  exp?: number; // Expiration time
  nbf?: number; // Not before time
  iat?: number; // Issued at time
  jti?: string; // JWT ID
};
