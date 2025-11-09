import { createServer, Server } from "http";
import express, { Application } from "express";
import { WebSocketServer } from "ws";
import setupMessageController from "./message.controller.js";
import setupMessageGateway, { setupClientMap } from "./message.gateway.js";

/**
 * This is a bit confusing since the ws server wraps the httpServer but express doesn't..
 * Essentially, an express app is a function that (req, res, next) => {} that tells an http server
 * how to handle requests. This function looks at the express routes you've defined on the object
 * and handles each of them using the underlying http methods (ex. res.writeHead or res.end)
 *
 * WebSocketServer wraps the httpServer and listens for HTTP/1.1 GET requests with the Upgrade header,
 * passing any other HTTP traffic to the underlying httpServer. When it finds an upgrade request,
 * it uses that TCP connection for the WebSocket protocol and stops passing any traffic to the underlying
 * httpServer.
 *
 * essentially ws wraps the http server and tries to intercept any traffic FIRST for potential
 * upgrades, and THEN it passes them to the httpServer, which USES the express instance to handle requests
 */

export const restServer: Application = express();
const server: Server = createServer(restServer);
export const wsServer: WebSocketServer = new WebSocketServer({ server });

// create controllers and gateways on the servers
setupMessageController(restServer);
setupMessageGateway(wsServer);

// bootstrap function
export function bootstrapServer(port: number) {
  // Initialize clients map for gateway
  setupClientMap();

  // Bootstrap server
  server.listen(port, () => {
    console.log(`App started on port ${port}`);
  });
}

export default server;
