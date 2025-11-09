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
    const requestedRoom: string | undefined = request.headers.location;

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
    console.log(clients);
    console.log("adding client");

    // Receive message handler
    client.on("message", (data) => {
      try {
        // Persist the new message
        const newMessage: Message = JSON.parse(data.toString()); // throws an error if data cannot be parsed as JSON
        if (!isMessage(newMessage)) throw new TypeError(); // throw a type error if the data is not a valid Message object
        addMessage(newMessage);

        // If successful, send it to all clients in the room
        room.forEach((roomClient) => {
          roomClient.send(JSON.stringify(newMessage));
        });
      } catch (e) {}
    });

    // When the client disconnects, remove them from the room
    client.on("close", (client: WebSocket) => {
      room.delete(client);
      console.log(clients);
      console.log("removing client");
    });
  });
}
