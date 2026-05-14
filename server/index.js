import express from 'express';
import crypto from "crypto";
import { WebSocketServer } from 'ws';
import { v4 as uuid } from 'uuid';

const app = express();

const tunnels = {};

const httpServer = app.listen(80, () => {
  console.log("HTTP server running on port 80");
});

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  const tunnelId = uuid().slice(0, 6);

  tunnels[tunnelId] = ws;

  console.log("Client connected:", tunnelId);

  ws.send(
    JSON.stringify({
      type: "connected",
      tunnelId,
    })
  );

  ws.on("close", () => {
    delete tunnels[tunnelId];
    console.log("Client disconnected:", tunnelId);
  });
});

// Public URL route
app.get("/:tunnelId", (req, res) => {
  const { tunnelId } = req.params;

  const client = tunnels[tunnelId];

  if (!client) {
    return res.send("Tunnel not found");
  }

  // Ask laptop for localhost data
  client.send(
    JSON.stringify({
      type: "request",
    })
  );

  // Wait for response
  client.once("message", (message) => {
    const data = JSON.parse(message);

    res.send(data.body);
  });
});
