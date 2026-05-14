import WebSocket from "ws";
import axios from "axios";

const PORT = process.argv[2];

if (!PORT) {
  console.log("Usage: tunnel http <port>");
  process.exit(1);
}

const SERVER_URL = "ws://<server-ip>:8080";

// Check if local app exists
async function checkLocalPort() {
  try {
    await axios.get(`http://localhost:${PORT}`);

    return true;
  } catch (error) {
    return false;
  }
}

async function startTunnel() {
  // Step 1: Check localhost first
  const isLocalRunning = await checkLocalPort();

  if (!isLocalRunning) {
    console.log(
      `Nothing is running on localhost:${PORT}`
    );
    console.log(
      `Start your React/Next app first, then run tunnel again.`
    );
    process.exit(1);
  }

  try {
    const ws = new WebSocket(SERVER_URL);

    // Successful connection
    ws.on("open", () => {
      console.log(
        `Connected to tunnel server`
      );
    });

    // Messages from server
    ws.on("message", async (message) => {
      const data = JSON.parse(message);

      // Public URL
      if (data.type === "connected") {
        console.log(
          `Public URL: http://<server-ip>/${data.tunnelId}`
        );
      }

      // Incoming browser traffic
      if (data.type === "request") {
        try {
          const response = await axios.get(
            `http://localhost:${PORT}`
          );

          ws.send(
            JSON.stringify({
              body: response.data,
            })
          );
        } catch (error) {
          ws.send(
            JSON.stringify({
              body: `Local app error`,
            })
          );
        }
      }
    });

    // WebSocket errors
    ws.on("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        console.log(
          "Cannot connect to server."
        );
      } else {
        console.log(
          `Connection error: ${error.message}`
        );
      }

      process.exit(1);
    });

    // Disconnected
    ws.on("close", () => {
      console.log(
        "Tunnel disconnected."
      );
    });

  } catch (error) {
    console.log(
      `Unexpected error: ${error.message}`
    );
    process.exit(1);
  }
}

startTunnel();