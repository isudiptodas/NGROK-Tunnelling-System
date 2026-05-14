import express from "express";
import { WebSocketServer } from "ws";
import crypto from "crypto";

const app = express();

const tunnels = {};

// Public browser server
app.listen(3000, "0.0.0.0", () => {
  console.log("HTTP server running on port 3000");
});

// Tunnel websocket server
const wss = new WebSocketServer({
  host: "0.0.0.0",
  port: 8080,
});

wss.on("connection", (ws) => {
  const tunnelId = crypto
    .randomBytes(3)
    .toString("hex");

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
  });
});

// Browser → EC2 → Laptop
app.get("/:tunnelId", (req, res) => {
  const tunnelId = req.params.tunnelId;

  const client = tunnels[tunnelId];

  if (!client) {
    return res.send("Tunnel not found");
  }

  // Remove tunnelId from URL
  const path = req.originalUrl.replace(
    `/${tunnelId}`,
    ""
  );

  client.send(
    JSON.stringify({
      type: "request",
      path,
    })
  );

  client.once("message", (message) => {
    const data = JSON.parse(message);

    res.send(data.body);
  });
});
