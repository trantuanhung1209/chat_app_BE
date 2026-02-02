import express from 'express'; 
import passport from "passport";
import authController from '../controllers/authContronller.js';
import { authenticateRefreshToken, authenticateAccessToken } from '../middleware.js';

const router = express.Router();

// register route
router.post('/register', authController.register);

// login route
router.post('/login', authController.login);

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