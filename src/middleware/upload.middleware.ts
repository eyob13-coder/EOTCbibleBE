import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the avatars upload directory exists
const avatarsUploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(avatarsUploadDir, { recursive: true });

// Configure storage for avatar images
const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, avatarsUploadDir);
    },
    filename: (req, file, cb) => {
        const userId =
            (req as any).user?._id?.toString() ||
            'anonymous';
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '';
        const sanitizedExt = ext.toLowerCase();
        cb(null, `${userId}-${timestamp}-${random}${sanitizedExt}`);
    }
});

// Allow only image mime types
const avatarFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
};

export const uploadAvatarMiddleware = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('avatar');


