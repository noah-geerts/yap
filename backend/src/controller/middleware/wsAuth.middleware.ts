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
    // No auth header. Send proper HTTP error and destroy socket
    if (req.headers?.authorization === undefined) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const jwt = req.headers.authorization.split(" ")[1];
      const payload = await verifyJwt(jwt);

      // Auth successful - let WebSocket server handle the upgrade
      wsServer.handleUpgrade(req, socket, head, (client) => {
        wsServer.emit("connection", client, req);
      });
    } catch (error) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  };
}
