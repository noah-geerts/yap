import { IncomingMessage } from "http";
import Stream from "stream";
import { verifyJwt } from "../../service/jwt.service.js";
import { WebSocketServer } from "ws";

export function createWsAuthMiddleware(wsServer: WebSocketServer) {
  return async (
    req: IncomingMessage,
    socket: Stream.Duplex,
    head: NonSharedBuffer
  ) => {
    try {
      if (!req.url) throw new Error("No URL header present in the request"); // No url header? the catch will reject ws connection
      const url = new URL(req.url, `http://${req.headers.host}`);
      const jwt = url.searchParams.get("auth") || "";
      const payload = await verifyJwt(jwt); // No auth query param? jwt will be "", so verifyJwt will throw, and the catch will reject ws connection

      // Auth successful - let WebSocket server handle the upgrade
      wsServer.handleUpgrade(req, socket, head, (client) => {
        wsServer.emit("connection", client, req);
      });
    } catch (error) {
      // Reject connection
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  };
}
