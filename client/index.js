import WebSocket from "ws";
import axios from "axios";

const PORT = process.argv[2];

const ws = new WebSocket(
  "ws://YOUR_EC2_IP:8080"
);

ws.on("message", async (message) => {
  const data = JSON.parse(message);

  // Public URL
  if (data.type === "connected") {
    console.log(
      `Public URL: http://<YOUR_EC2_IP>:3000/${data.tunnelId}`
    );
  }

  // Browser request
  if (data.type === "request") {
    try {
      const response = await axios.get(
        `http://localhost:${PORT}${data.path || "/"}`
      );

      ws.send(
        JSON.stringify({
          body: response.data,
        })
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          body: "Error loading local app",
        })
      );
    }
  }
});
