import express from "express";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import cookieParser from "cookie-parser";

const app = express();
const tunnels = {};
const pendingRequests = {};

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, "0.0.0.0", () => {
  console.log("HTTP server running on port 3000");
});

const wss = new WebSocketServer({
  host: "0.0.0.0",
  port: 8080
});

wss.on("connection", (ws) => {
  const tunnelId = crypto.randomBytes(3).toString("hex");

  tunnels[tunnelId] = ws;

  console.log(`Client connected: ${tunnelId}`);

  ws.send(JSON.stringify({
    type: "connected",
    tunnelId
  }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type !== "response") return;

      const res = pendingRequests[data.requestId];

      if (!res) return;

      delete pendingRequests[data.requestId];

      if (data.contentType) res.setHeader("Content-Type", data.contentType);

      let body = Buffer.from(data.body, "base64");

      if (data.contentType?.includes("text/html")) {
        body = body.toString();

        body = body.replace("<head>", `<head><base href="/${tunnelId}/"><script>(function(){const code='/${tunnelId}'; if(location.pathname.startsWith(code)){history.replaceState({},'',location.pathname.replace(code,'')||'/'+location.search+location.hash);}})();</script>`);

        body = Buffer.from(body);
      }

      res.status(data.status).send(body);

    } catch (error) {
      console.log(`Response error: ${error.message}`);
    }
  });

  ws.on("close", () => {
    delete tunnels[tunnelId];
    console.log(`Client disconnected: ${tunnelId}`);
  });
});

app.use((req, res) => {
  let tunnelId = req.path.split("/")[1];

  if (tunnels[tunnelId]) {
    res.cookie("tunnelId", tunnelId);
  } else {
    tunnelId = req.headers.cookie?.split("=")[1];
  }

  const client = tunnels[tunnelId];

  if (!client) return res.status(404).send("Tunnel not found");

  const realPath = req.originalUrl.startsWith(`/${tunnelId}`) ? req.originalUrl.replace(`/${tunnelId}`, "") || "/" : req.originalUrl;

  const requestId = crypto.randomUUID();

  pendingRequests[requestId] = res;

  client.send(JSON.stringify({
    type: "request",
    requestId,
    method: req.method,
    path: realPath,
    headers: req.headers,
    body: req.body
  }));

  setTimeout(() => {
    if (!pendingRequests[requestId]) return;

    delete pendingRequests[requestId];

    if (!res.headersSent) res.status(504).send("Tunnel timeout");
  }, 30000);
});