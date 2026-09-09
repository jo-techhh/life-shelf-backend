import multer from 'multer';
import { BadRequestError } from '../common/errors/app-error.js';

const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestError(
          `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP images are allowed.`,
        ),
      );
    }
  },
});
