import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import '../config/cloudinary.config'; // Import config to ensure cloudinary is configured

// Configure storage for avatar images
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optimize image size
    } as any // Cast to any because CloudinaryStorage params type is not perfectly aligned
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
