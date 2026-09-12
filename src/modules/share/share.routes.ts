import { Router } from 'express';
import { ShareController } from './share.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Authenticated endpoints for user managing their share link
router.get('/watch/status', authMiddleware, ShareController.getStatus);
router.post('/watch', authMiddleware, ShareController.enableShare);
router.delete('/watch', authMiddleware, ShareController.revokeShare);

export default router;
