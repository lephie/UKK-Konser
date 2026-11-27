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

/// user avatar
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
fs.mkdirSync(AVATAR_DIR, {recursive: true})

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };


const handleUpload = (middleware, label) => (req, res, next) => {
    middleware(req, res, (err) => {
        if (err) {
            return error(
                res,
                err.code === 'LIMIT_FILE_SIZE'
                    ? `${label} image max 5 MB`
                    : err.message,
                400
            );
        }

        next();
    });
};

 
// venue code 
const layoutUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, LAYOUT_DIR),
        filename: (req, file, cb) =>
            cb(null, `${randomUUID()}${EXT[file.mimetype]}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        EXT[file.mimetype]
            ? cb(null, true)
            : cb(new Error('Layout must be a JPG, PNG or WEBP image'))
});

export const uploadLayout = handleUpload(
    layoutUpload.single('layout'),
    'Layout'
);

export const layoutPath = (file) =>
    file ? `/uploads/layouts/${file.filename}` : null;


 
// avatar upload
const avatarUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, AVATAR_DIR),
        filename: (req, file, cb) =>
            cb(null, `${randomUUID()}${EXT[file.mimetype]}`)
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
        EXT[file.mimetype]
            ? cb(null, true)
            : cb(new Error('Avatar must be a JPG, PNG or WEBP image'))
});

export const uploadAvatar = handleUpload(
    avatarUpload.single('avatar'),
    'Avatar'
);

export const avatarPath = (file) =>
    file ? `/uploads/avatars/${file.filename}` : null;


 
// delete uploaded file
 

export const removeUploaded = (publicPath) => {
    if (!publicPath || !publicPath.startsWith('/uploads/layouts/')) return;

    fs.unlink(path.join(LAYOUT_DIR, path.basename(publicPath)),
        () => {}
    );
};

export const removeAvatar = (publicPath) => {
    if (!publicPath || !publicPath.startsWith('/uploads/avatars/')) return;

    fs.unlink(path.join(AVATAR_DIR, path.basename(publicPath)),
        () => {}
    );
};