// types/express.d.ts
import { Payload } from "./Payload.ts";
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: Payload; // or your custom UserPayload type
  }
}
