import WebSocket, { WebSocketServer } from "ws";
import { getAllRoomNames } from "../service/room.service.js";
import { IncomingMessage } from "http";
import Message, { isMessage } from "../domain/Message.js";
import { addMessage } from "../repository/message.repository.js";

// Use a map to keep track of which chat room each connection wants to chat with
export const clients: Map<string, Set<WebSocket>> = new Map();

export function setupClientMap() {
  const roomNames = getAllRoomNames();
  for (let roomName of roomNames) {
    clients.set(roomName, new Set());
  }
}

export default function setupMessageGateway(wsServer: WebSocketServer) {
  wsServer.on("connection", (client: WebSocket, request: IncomingMessage) => {
    let requestedRoom: string | null = null;
    try {
      const url = request.url
        ? new URL(request.url, `http://${request.headers.host}`)
        : undefined;
      requestedRoom = url ? url.searchParams.get("room") : null;
    } catch (e) {} // catches errors parsing url and leaves requestRoom as null

    // Close connection with no valid room
    const room: Set<WebSocket> | undefined = clients.get(
      requestedRoom || "A1msdajbk9=-asdio210l"
    );
    if (room === undefined) {
      client.close();
      return;
    }

    // Otherwise register the connection and create event handlers
    room.add(client);

    // Receive message handler
    client.on("message", (data) => {
      try {
        // Persist the new message
        const newMessage: Message = JSON.parse(data.toString()); // throws an error if data cannot be parsed as JSON
        if (!isMessage(newMessage)) throw new TypeError(); // throw a type error if the data is not a valid Message object
        addMessage(newMessage); // throws an error if the message cannot be persisted

        // If successful, send it to all clients in the room
        room.forEach((roomClient) => {
          roomClient.send(JSON.stringify(newMessage));
        });
      } catch (e) {}
    });

    // When the client disconnects, remove them from the room
    client.on("close", () => {
      room.delete(client);
    });
  });
}
