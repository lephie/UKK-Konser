import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { error } from '../utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const LAYOUT_DIR = path.join(UPLOAD_ROOT, 'layouts');
fs.mkdirSync(LAYOUT_DIR, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, LAYOUT_DIR),
        filename: (req, file, cb) => cb(null, `${randomUUID()}${EXT[file.mimetype]}`) // random name, user's filename is never used
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        EXT[file.mimetype] ? cb(null, true) : cb(new Error('Layout must be a JPG, PNG or WEBP image'))
});

// field name in the form-data: "layout"
export const uploadLayout = (req, res, next) =>
    upload.single('layout')(req, res, (err) => {
        if (err) return error(res, err.code === 'LIMIT_FILE_SIZE' ? 'Layout image max 5 MB' : err.message, 400);
        next();
    });

export const layoutPath = (file) => (file ? `/uploads/layouts/${file.filename}` : null);

// delete a stored file (safe: only ever touches files inside uploads/layouts)
export const removeUploaded = (publicPath) => {
    if (!publicPath || !publicPath.startsWith('/uploads/layouts/')) return;
    fs.unlink(path.join(LAYOUT_DIR, path.basename(publicPath)), () => {});
};