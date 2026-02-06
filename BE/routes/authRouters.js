import express from 'express'; 
import passport from "passport";
import authController from '../controllers/authContronller.js';
import { authenticateAccessToken } from '../middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// register route (giới hạn 5 lần/15 phút)
router.post('/register', authLimiter, authController.register);

// login route (giới hạn 5 lần/15 phút)
router.post('/login', authLimiter, authController.login);

// logout route
router.post('/logout', authController.logout);

// me
router.get('/me', authenticateAccessToken, authController.getMe);

// refresh token route
router.post('/refresh', authController.refreshToken);

// Google OAuth routes
router.get('/google', 
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    authController.googleOAuthCallback
);


export default router;