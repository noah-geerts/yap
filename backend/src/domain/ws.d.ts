import "http";
import { Payload } from "./Payload.ts";

// Extend http IncomingMessage type to include our user Payload as an optional field for auth middleware
declare module "http" {
  interface IncomingMessage {
    user?: Payload;
  }
}
