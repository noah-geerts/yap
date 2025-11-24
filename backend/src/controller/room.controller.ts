import { Application } from "express";
import { getAllRoomNames } from "../service/room.service.js";

export default function setupRoomController(restServer: Application) {
  // GET /rooms
  restServer.get("/rooms", (req, res) => {
    const rooms = getAllRoomNames();
    console.log(JSON.stringify(req.user, null, 2));
    res.status(200).json(rooms);
  });
}
