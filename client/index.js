import WebSocket from "ws";
import axios from "axios";

const PORT = process.argv[2];

function log(message) {
  console.log(`[Tunnel] ${message}`);
}

if (!PORT) {
  log("Usage: tunnel http <port>");
  process.exit(1);
}

async function startTunnel() {
  try {
    await axios.get(`http://localhost:${PORT}`);
    log(`Local application detected on port ${PORT}`);
  } catch (error) {
    log(`Nothing is running on localhost:${PORT}`);
    process.exit(1);
  }

  const ws = new WebSocket("ws://43.205.195.230:8080");

  ws.on("open", () => log("Connected to tunnel server"));

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "connected") {
        log(`Tunnel is live at http://43.205.195.230:3000/${data.tunnelId}`);
        return;
      }

      if (data.type === "request") {
        log(`${data.method} ${data.path}`);

        const response = await axios({
          method: data.method,
          url: `http://localhost:${PORT}${data.path}`,
          headers: data.headers,
          data: data.body,
          responseType: "arraybuffer",
          validateStatus: () => true
        });

        ws.send(JSON.stringify({
          type: "response",
          requestId: data.requestId,
          status: response.status,
          body: Buffer.from(response.data).toString("base64"),
          contentType: response.headers["content-type"]
        }));
      }

    } catch (error) {
      log(`Request failed: ${error.message}`);
    }
  });

  ws.on("error", (error) => log(`Connection failed: ${error.message}`));

  ws.on("close", () => log("Tunnel disconnected"));
}

startTunnel();