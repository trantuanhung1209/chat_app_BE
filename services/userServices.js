import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";

const getAllUsers = async () => {
    try {
        return await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        });
    } catch (error) {
        throw new Error("Error fetching users: " + error.message);
    }
};

const createUser = async (userData) => {
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        return await prisma.user.create({
            data: {
                fullName: userData.fullName,
                email: userData.email,
                password: hashedPassword,
                avatar: userData.avatar || null
            }
        });
    } catch (error) {
        throw new Error("Error creating user: " + error.message);
    }
};

const deleteUserById = async (userId) => {
    try {
        return await prisma.user.delete({
            where: { id: userId }
        });
    } catch (error) {
        throw new Error("Error deleting user: " + error.message);
    }
};

const updateUserById = async (userId, updateData) => {
    try {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        return await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
    } catch (error) {
        throw new Error("Error updating user: " + error.message);
    }
};

const getUserById = async (userId) => {
    try {
        return await prisma.user.findUnique({
            where: { id: userId }
        });
    } catch (error) {
        throw new Error("Error fetching user: " + error.message);
    }
};

export default {
    getAllUsers,
    createUser,
    deleteUserById,
    updateUserById,
    getUserById
};
