// types/express.d.ts
import { Payload } from "./Payload.ts";
import "express";

// Extend express Request type to include our user Payload as an optional field for auth middleware
declare module "express-serve-static-core" {
  interface Request {
    user?: Payload;
  }
}
