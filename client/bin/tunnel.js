#!/usr/bin/env node

import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

// Same as __filename in CommonJS
const __filename = fileURLToPath(import.meta.url);

// Same as __dirname in CommonJS
const __dirname = path.dirname(__filename);

const protocol = process.argv[2];
const port = process.argv[3];

if (protocol !== "http") {
  console.log("Only HTTP supported for now.");
  process.exit(1);
}

// Absolute path to client/index.js
const clientPath = path.join(
  __dirname,
  "..",
  "index.js"
);

spawn(
  "node",
  [clientPath, port],
  {
    stdio: "inherit"
  }
);