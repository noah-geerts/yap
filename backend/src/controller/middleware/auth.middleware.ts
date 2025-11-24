import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../service/jwt.service.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If no authorization header is included, auth fails
  if (!req.headers.authorization) {
    res.status(401).send();
    return;
  }

  // Otherwise try to verify the jwt and attach the payload as a user object to req
  try {
    const jwt = req.headers.authorization.split(" ")[1];
    const payload = await verifyJwt(jwt);
    req.user = payload;
  } catch (error) {
    // Either array access [1] failed, in which case the auth header was incorrectly structured, or
    // verifyJwt threw an error. Either way, auth fails.
    res.status(401).send();
    return;
  }

  // If nothing failed, call next()
  next();
};
