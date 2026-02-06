import express from 'express';
import changePasswordController from '../controllers/changePasswordController.js';
import { authenticateAccessToken } from '../middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /change-password - Đổi mật khẩu (cần authentication)
router.post('/', authenticateAccessToken, authLimiter, changePasswordController.changePassword);

// POST /change-password/set - Đặt mật khẩu lần đầu cho Google users (cần authentication)
router.post('/set', authenticateAccessToken, authLimiter, changePasswordController.setPassword);

export default router;
