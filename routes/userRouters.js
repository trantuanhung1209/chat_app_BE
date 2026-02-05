import express from 'express';
import userController from '../controllers/userController.js';
import { authenticateAccessToken } from '../middleware.js';
import { authorizeRoles } from '../middleware.js';

const router = express.Router();

// get all users
router.get('/', authenticateAccessToken, authorizeRoles('ADMIN'), userController.getUsers);

// search users for friend request
router.get('/search', authenticateAccessToken, userController.searchUsers);

// get user by id (optional)
router.get('/:id', authenticateAccessToken, userController.getUserById);

// post new user 
router.post('/', userController.createUser);

// delete user by id (optional)
router.delete('/:id', authenticateAccessToken, authorizeRoles('ADMIN'), userController.deleteUserById);

// update user by id (optional)
router.patch('/:id', authenticateAccessToken, userController.updateUserById);

export default router;