import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import { connectDb } from "./utils/db.js";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/tests.js";
import sessionRoutes from "./routes/sessions.js";
import { registerExamSocket } from "./socket/examSocket.js";
import { errorHandler } from "./middleware/errorHandler.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
const app = express();
const server = http.createServer(app);

function parseAllowedOrigins(rawOrigins) {
  const fallback = ["http://localhost:5173"];
  if (!rawOrigins) return fallback;

  const parsed = String(rawOrigins)
    .split(",")
    .map((entry) => entry.trim().replace(/^['\"]+|['\"]+$/g, ""))
    .filter(Boolean);

  return parsed.length ? parsed : fallback;
}

const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "proctorai-server" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(errorHandler);

registerExamSocket(io);

const PORT = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDb();
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on ${PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught exception:", error);
});
