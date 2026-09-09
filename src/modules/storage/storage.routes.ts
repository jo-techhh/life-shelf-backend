import { Router } from 'express';
import { StorageController } from './storage.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { configureCloudinarySchema } from './storage.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', StorageController.getConfig);
router.post(
  '/cloudinary',
  validate({ body: configureCloudinarySchema }),
  StorageController.configureCloudinary,
);
router.post(
  '/providers/cloudinary',
  validate({ body: configureCloudinarySchema }),
  StorageController.configureCloudinary,
);
router.delete('/cloudinary', StorageController.deleteConfig);

export default router;
