import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { isLoggedIn } from "./app/middlewares/AuthMiddlewere";
import connectDatabase from "./config/Database";
import { SocketServer } from "./config/SocketServer";
import adminRoute from "./routes/admin";
import apiRoutes from "./routes/api";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import roleRoutes from "./routes/role";

dotenv.config();
const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 8000;

//Connect Database
const mongoUri: string | any = process.env.MONGO_URI;
connectDatabase(mongoUri);

function getAllowedOrigins(): string[] {
  const list = [
    process.env.FRONTEND_HOST || '',
    process.env.FRONTEND_ORIGIN || '',
    process.env.ALLOWED_ORIGINS || '',
  ]
    .join(',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(list));
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    // In development echo back any origin to simplify local testing
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    const whitelist = getAllowedOrigins();
    if (whitelist.length === 0) return callback(new Error("CORS origin not configured"));
    return whitelist.includes(origin) ? callback(null, true) : callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-refresh-token",
    "deviceid",
    "Accept",
    "Access-Control-Request-Private-Network",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middleware
// Add support for Chrome private network preflights when using LAN IPs
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Private-Network", "true");
  }
  // Ensure caches/proxies vary by Origin to avoid CORS leakage
  res.header("Vary", "Origin");
  next();
});

app.use(cors(corsOptions));
// Express 5 with path-to-regexp@6: use a RegExp for catch-all OPTIONS preflights
app.options(/.*/, cors(corsOptions));
// Allow embedding static assets (images/audio) cross-origin from the frontend dev server
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());

// Routes for API
app.use("/", apiRoutes);
app.use("/api/", authRoutes);
app.use("/api/chat/", chatRoutes);
app.use("/api/admin/", isLoggedIn, adminRoute);
app.use("/api/admin/", isLoggedIn, roleRoutes);

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    status: true, 
    message: "Server is running", 
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve uploaded media statically from /uploads
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(UPLOAD_ROOT));

// Initialize Socket.IO server
const socketServer = new SocketServer(server);

// Start the server
server.listen(PORT, () => {
  console.log(`The server is running on PORT http://localhost:${PORT}`);
  console.log(`WebSocket server is ready for real-time messaging`);
});
