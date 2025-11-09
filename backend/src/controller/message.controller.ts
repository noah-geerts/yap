import qs from "qs";
import { Request, Response, Application } from "express";
import { getAllMessages } from "../service/message.service.js";
import Message from "../domain/Message.js";

export default function setupMessageController(restServer: Application) {
  // Configure query parameter parser to not allow nested objects
  restServer.set("query parser", (str: string) => {
    return qs.parse(str, { depth: 0, ignoreQueryPrefix: true });
  });

  type FlatQuery = Record<string, string>;
  type FlatRequest<P = any, ResBody = any, ReqBody = any> = Request<
    P,
    ResBody,
    ReqBody,
    FlatQuery
  >;

  // GET /messages/:room
  restServer.get("/messages/:room", (req: FlatRequest, res: Response) => {
    const room: string = req.params.room;

    // Extract limit query param
    let limit = 20;
    if (req.query.limit !== undefined) {
      const parsed = parseInt(req.query.limit);
      if (!isNaN(parsed)) limit = parsed;
      else res.status(500).send();
    }

    // Extract offset query param
    let offset = 0;
    if (req.query.offset !== undefined) {
      const parsed = parseInt(req.query.offset);
      if (!isNaN(parsed)) offset = parsed;
      else res.status(500).send();
    }

    const result: Message[] = getAllMessages(room, offset, limit);
    res.status(200).json(result);
  });
}
