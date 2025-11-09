import Message from "../domain/Message.js";
import Room from "../domain/Room.js";

// This is our 'db' for now
const rooms = new Map<string, Room>();

export function clearDb() {
  rooms.clear();
}

export default rooms;
