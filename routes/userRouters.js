import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

// get all users
router.get('/', userController.getUsers);

// get user by id (optional)
router.get('/:id', userController.getUserById);

// post new user 
router.post('/', userController.createUser);

// delete user by id (optional)
router.delete('/:id', userController.deleteUserById);

// update user by id (optional)
router.patch('/:id', userController.updateUserById);
export default router;