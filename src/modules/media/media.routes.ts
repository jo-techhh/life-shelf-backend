import { Router } from 'express';
import { MediaController } from './media.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { mediaQuerySchema } from './media.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate({ query: mediaQuerySchema }), MediaController.listUserMedia);
router.get('/defaults', MediaController.getDefaultAssets);
router.post('/upload', uploadMiddleware.single('file'), MediaController.uploadImage);
router.delete('/:id', MediaController.deleteMedia);

export default router;
