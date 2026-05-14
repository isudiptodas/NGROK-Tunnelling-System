#!/usr/bin/env node

import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const command = process.argv[2];
  const port = process.argv[3];

  if (command !== "http" || !port) {
    console.log("[Tunnel] Usage: tunnel http <port>");
    process.exit(1);
  }

  const clientPath = path.join(__dirname, "..", "index.js");

  spawn("node", [clientPath, port], { stdio: "inherit" });

} catch (error) {
  console.log(`[Tunnel] CLI error: ${error.message}`);
}