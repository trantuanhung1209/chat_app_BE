import express from 'express'; 
import authController from '../controllers/authContronller.js';
import { authenticateRefreshToken } from '../middleware.js';

const router = express.Router();

// register route
router.post('/register', authController.register);

// login route
router.post('/login', authController.login);

// logout route
router.post('/logout', authController.logout);

// refresh token route
router.post('/refresh', authenticateRefreshToken, authController.refreshToken);


export default router;