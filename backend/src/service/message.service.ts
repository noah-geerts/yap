import { off } from "process";
import { addMessage, getMessages } from "../repository/message.repository.js";
import Message from "../domain/Message.js";

export function sendMessage(message: Message) {
  return addMessage(message);
}

export function getAllMessages(
  roomName: string,
  offset: number,
  limit: number
) {
  return getMessages(roomName, offset, limit);
}
