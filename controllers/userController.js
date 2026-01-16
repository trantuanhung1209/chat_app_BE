
import userServices from '../services/userServices.js';
import { validateUser } from '../dtos/user.js';

const getUsers = async (req, res) => {
    try {
        const users = await userServices.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createUser = async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).json({ errors: error.details.map(e => e.message) });
    }

    try {
        const { fullName, email, password, avatar } = req.body;
        const newUser = {
            fullName, email, password, avatar
        }
        const createdUser = await userServices.createUser(newUser);
        res.status(201).json(createdUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const deleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        await userServices.deleteUserById(userId);
        res.status(200).json({ message: `User with id ${userId} deleted.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const updateUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        const updatedUser = await userServices.updateUserById(userId, updateData);
        res.status(200).json({ message: `User with id ${userId} updated.`, user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userServices.getUserById(userId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: `User with id ${userId} not found.` });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default {
    getUsers,
    createUser,
    deleteUserById,
    updateUserById,
    getUserById
};