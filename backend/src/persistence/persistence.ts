import Message from "../domain/Message.js";
import Room from "../domain/Room.js";

// This is our 'db' for now
const rooms = new Map<string, Room>();

export function clearDb() {
  // Clear all messages (do not clear rooms..)
  for (let key of [...rooms.keys()]) {
    const room = rooms.get(key);
    if (room !== undefined) room.messages = [];
  }
}

export default rooms;
