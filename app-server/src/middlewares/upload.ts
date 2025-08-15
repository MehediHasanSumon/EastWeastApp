import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const avatarDir = path.join(uploadsRoot, 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarDir),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

export const uploadAvatar = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Invalid file type'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});


