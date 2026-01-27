import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { validateEnv, PORT } from "./config.js";
import { InterviewOrchestrator } from "./orchestrator/InterviewOrchestrator.js";

// Validate environment
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express app setup
const app = express();
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: "/ws" });

// Serve static files from frontend build (production) or public folder
const publicPath = path.join(__dirname, "../../frontend/dist");
const fallbackPath = path.join(__dirname, "../../public");

// Try frontend/dist first, fallback to public
app.use(express.static(publicPath));
app.use(express.static(fallbackPath));

// Serve index.html for SPA routes
app.get("*", (req, res) => {
  // Try frontend build first
  const frontendIndex = path.join(publicPath, "index.html");
  const fallbackIndex = path.join(fallbackPath, "index.html");

  res.sendFile(frontendIndex, (err) => {
    if (err) {
      res.sendFile(fallbackIndex);
    }
  });
});

// WebSocket connection handler
wss.on("connection", (clientSocket) => {
  console.log("[Server] New client connected");

  // Create orchestrator for this client session
  // Default to "step" mode, client can change via set_mode message
  new InterviewOrchestrator(clientSocket, "step");
});

// Error handling
wss.on("error", (error) => {
  console.error("[Server] WebSocket server error:", error);
});

// Start server
server.listen(PORT, () => {
  console.log(`
===============================================
  AI Interview Simulation Server
===============================================

  Server running at: http://localhost:${PORT}
  WebSocket endpoint: ws://localhost:${PORT}/ws

  Environment:
  - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "Set" : "Not set"}

===============================================
`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Server] Shutting down...");
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log("[Server] Server closed");
    process.exit(0);
  });
});
