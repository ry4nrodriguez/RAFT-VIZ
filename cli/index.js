#!/usr/bin/env node

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "dist");
const DEFAULT_PORT = 8420;
const DEFAULT_WATCH_PATH = path.join(os.homedir(), ".raftvis", "events.jsonl");
const SAMPLE_NAMES = ["happy-path", "leader-crash", "split-vote", "network-partition"];

export function parseArgs(argv) {
  const args = [...argv];
  const options = {
    watchPath: undefined,
    positionalPath: undefined,
    port: DEFAULT_PORT,
    noOpen: false,
    sample: undefined,
    help: false
  };

  while (args.length > 0) {
    const token = args.shift();
    if (!token) {
      continue;
    }
    if (token === "--watch") {
      options.watchPath = args.shift();
    } else if (token === "--port") {
      options.port = Number(args.shift() ?? DEFAULT_PORT);
    } else if (token === "--no-open") {
      options.noOpen = true;
    } else if (token === "--sample") {
      options.sample = args.shift();
    } else if (token === "--help" || token === "-h") {
      options.help = true;
    } else if (!token.startsWith("-") && !options.positionalPath) {
      options.positionalPath = token;
    }
  }

  return options;
}

function printHelp() {
  console.log(`RaftVis

Usage:
  raftvis
  raftvis <path>
  raftvis --watch <path> [--port 8420] [--no-open]
  raftvis --sample happy-path
`);
}

function resolveWatchPath(options) {
  return path.resolve(options.watchPath || options.positionalPath || DEFAULT_WATCH_PATH);
}

function tryReadFile(targetPath) {
  try {
    return fs.readFileSync(targetPath, "utf8");
  } catch (error) {
    return null;
  }
}

function samplePath(sample) {
  return path.join(DIST_DIR, "samples", `${sample}.jsonl`);
}

function readSample(sample) {
  if (!sample || !SAMPLE_NAMES.includes(sample)) {
    return null;
  }
  return tryReadFile(samplePath(sample));
}

export function buildStatusPayload({ watchPath, sample }) {
  const liveText = tryReadFile(watchPath);
  if (liveText) {
    return {
      mode: "live",
      filePath: watchPath,
      initialText: liveText,
      availableSamples: SAMPLE_NAMES,
      banner: "Watching your Raft event log for changes."
    };
  }

  const fallbackSample = readSample(sample) ?? readSample("happy-path") ?? "";
  return {
    mode: "sample",
    filePath: watchPath,
    initialText: fallbackSample,
    availableSamples: SAMPLE_NAMES,
    banner: `No events found at ${watchPath}. Run your Raft tests first, or explore a sample replay.`
  };
}

function contentType(targetPath) {
  if (targetPath.endsWith(".js")) return "text/javascript";
  if (targetPath.endsWith(".css")) return "text/css";
  if (targetPath.endsWith(".json")) return "application/json";
  if (targetPath.endsWith(".jsonl")) return "application/x-ndjson";
  if (targetPath.endsWith(".svg")) return "image/svg+xml";
  if (targetPath.endsWith(".html")) return "text/html";
  return "text/plain";
}

async function findPort(start) {
  let port = start;
  while (port < start + 20) {
    const free = await new Promise((resolve) => {
      const tester = http.createServer();
      tester.once("error", () => resolve(false));
      tester.once("listening", () => {
        tester.close(() => resolve(true));
      });
      tester.listen(port, "127.0.0.1");
    });
    if (free) {
      return port;
    }
    port += 1;
  }
  throw new Error("Could not find an available port.");
}

function openBrowser(targetUrl) {
  const platform = process.platform;
  const command =
    platform === "darwin"
      ? ["open", targetUrl]
      : platform === "win32"
        ? ["cmd", "/c", "start", targetUrl]
        : ["xdg-open", targetUrl];

  const child = spawn(command[0], command.slice(1), {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url ?? "/index.html";
  const safePath = requestPath.split("?")[0];
  const targetPath = path.join(DIST_DIR, safePath);

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    res.writeHead(200, { "Content-Type": contentType(targetPath) });
    res.end(fs.readFileSync(targetPath));
    return;
  }

  const fallback = path.join(DIST_DIR, "index.html");
  if (fs.existsSync(fallback)) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(fallback));
    return;
  }

  res.writeHead(404);
  res.end("RaftVis viewer assets are missing. Run the viewer build first.");
}

async function start() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const watchPath = resolveWatchPath(options);
  const port = await findPort(options.port || DEFAULT_PORT);
  const clients = new Set();
  let status = buildStatusPayload({ watchPath, sample: options.sample });
  let lastSignature = "";

  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    if (req.url.startsWith("/api/status")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(status));
      return;
    }

    if (req.url.startsWith("/api/stream")) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });
      res.write(`data: ${JSON.stringify({ text: status.initialText, filePath: status.filePath, banner: status.banner })}\n\n`);
      clients.add(res);
      req.on("close", () => {
        clients.delete(res);
      });
      return;
    }

    serveStatic(req, res);
  });

  setInterval(() => {
    const nextStatus = buildStatusPayload({ watchPath, sample: options.sample });
    const nextSignature = `${nextStatus.banner}|${nextStatus.initialText.length}|${fs.existsSync(watchPath) ? fs.statSync(watchPath).mtimeMs : 0}`;
    if (nextSignature === lastSignature) {
      return;
    }

    lastSignature = nextSignature;
    status = nextStatus;
    for (const client of clients) {
      client.write(`data: ${JSON.stringify({ text: status.initialText, filePath: status.filePath, banner: status.banner })}\n\n`);
    }
  }, 750);

  server.listen(port, "127.0.0.1", () => {
    const targetUrl = `http://127.0.0.1:${port}`;
    console.log(`RaftVis running at ${targetUrl}`);
    if (!options.noOpen) {
      openBrowser(targetUrl);
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void start();
}

