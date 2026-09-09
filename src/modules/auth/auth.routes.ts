import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rate-limit.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
} from './auth.schema.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), AuthController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), AuthController.login);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/me', authMiddleware, AuthController.getMe);
router.post(
  '/change-password',
  authMiddleware,
  validate({ body: changePasswordSchema }),
  AuthController.changePassword,
);
router.patch(
  '/profile',
  authMiddleware,
  validate({ body: updateProfileSchema }),
  AuthController.updateProfile,
);
router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  AuthController.forgotPassword,
);

export default router;
