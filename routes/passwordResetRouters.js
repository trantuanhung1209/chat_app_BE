import express from 'express';
import passwordResetController from '../controllers/passwordResetController.js';
import { passwordResetLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /password-reset/request - Request OTP (giới hạn 3 lần/giờ)
router.post('/request', passwordResetLimiter, passwordResetController.requestPasswordReset);

// POST /password-reset/verify - Verify OTP (giới hạn 5 lần/5 phút)
router.post('/verify', otpVerifyLimiter, passwordResetController.verifyOTP);

// POST /password-reset/reset - Reset password with OTP (giới hạn 5 lần/5 phút)
router.post('/reset', otpVerifyLimiter, passwordResetController.resetPassword);

export default router;
