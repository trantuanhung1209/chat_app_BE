import express from 'express';
import userController from '../controllers/userController.js';
import { authenticateAccessToken } from '../middleware.js';

const router = express.Router();

// get all users
router.get('/', authenticateAccessToken, userController.getUsers);

// get user by id (optional)
router.get('/:id', authenticateAccessToken, userController.getUserById);

// post new user 
router.post('/', userController.createUser);

// delete user by id (optional)
router.delete('/:id', authenticateAccessToken, userController.deleteUserById);
// update user by id (optional)
router.patch('/:id', authenticateAccessToken, userController.updateUserById);
export default router;