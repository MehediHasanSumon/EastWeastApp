import multer from "multer";
import fs from "fs";
import path from "path";

// Use disk storage in a dedicated uploads directory served statically by Express
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const CHAT_DIR = path.join(UPLOAD_ROOT, "chat");
fs.mkdirSync(CHAT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CHAT_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || "");
    cb(null, `${unique}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // up to 20MB; adjust as needed
});
