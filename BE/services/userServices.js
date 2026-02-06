import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import logger from '../config/logger.js';

const getAllUsers = async (skip, limit, sortField = 'createdAt', sortOrder = 'asc') => {
    try {
        const users = await prisma.user.findMany({
            skip,
            take: limit,
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true
            },
            orderBy: {
                [sortField]: sortOrder
            }
        });
        const totalUsers = await prisma.user.count();
        return {
            users,
            totalUsers,
            currentPage: Math.floor(skip / limit) + 1,
            totalPages: Math.ceil(totalUsers / limit),
            limit,
            skip
        };
    } catch (error) {
        logger.error('get_users_failed', {
            status_code: 500,
            error: { name: error.name, message: error.message }
        });
        throw new Error("Error fetching users: " + error.message);
    }
};

const createUser = async (userData) => {
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await prisma.user.create({
            data: {
                fullName: userData.fullName,
                email: userData.email,
                password: hashedPassword,
                avatar: userData.avatar || null,
                type: 'EMAIL'
            }
        });
        logger.info('create_user_success', {
            user_id: user.id,
            status_code: 201
        });
        return user;
    } catch (error) {
        logger.error('create_user_failed', {
            status_code: 500,
            error: { name: error.name, message: error.message }
        });
        throw new Error("Error creating user: " + error.message);
    }
};

const deleteUserById = async (userId) => {
    try {
        return await prisma.user.delete({
            where: { id: userId }
        });
    } catch (error) {
        logger.error('delete_user_failed', {
            user_id: userId,
            status_code: 500,
            error: { name: error.name, message: error.message }
        });
        throw new Error("Error deleting user: " + error.message);
    }
};

const updateUserById = async (userId, updateData) => {
    try {
        // Chỉ cho phép update fullName và avatar
        const allowedData = {};
        
        if (updateData.fullName !== undefined) {
            allowedData.fullName = updateData.fullName;
        }
        
        if (updateData.avatar !== undefined) {
            allowedData.avatar = updateData.avatar;
        }

        return await prisma.user.update({
            where: { id: userId },
            data: allowedData,
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                role: true,
                createdAt: true
            }
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

const getUserByName = async (name) => {
    try {
        return await prisma.user.findMany({
            where: {
                fullName: {
                    contains: name,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        });
    } catch (error) {
        throw new Error("Error fetching users by name: " + error.message);
    }
};

const searchUsersForFriendRequest = async (currentUserId, searchQuery, skip = 0, limit = 20) => {
    try {
        // Lấy danh sách user có quan hệ với current user (bạn bè hoặc đã gửi/nhận lời mời)
        const existingRelations = await prisma.friendRequest.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            },
            select: {
                senderId: true,
                receiverId: true
            }
        });

        // Tạo danh sách userId cần loại trừ
        const excludeIds = new Set([currentUserId]); // Loại trừ bản thân
        existingRelations.forEach(relation => {
            excludeIds.add(relation.senderId);
            excludeIds.add(relation.receiverId);
        });

        // Điều kiện tìm kiếm chung
        const whereClause = {
            AND: [
                {
                    id: {
                        notIn: Array.from(excludeIds)
                    }
                },
                {
                    OR: [
                        {
                            fullName: {
                                contains: searchQuery,
                                mode: 'insensitive'
                            }
                        },
                        {
                            email: {
                                contains: searchQuery,
                                mode: 'insensitive'
                            }
                        }
                    ]
                }
            ]
        };

        // Đếm tổng số kết quả
        const total = await prisma.user.count({
            where: whereClause
        });

        // Tìm kiếm user theo tên hoặc email, loại trừ những user đã có quan hệ
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true
            },
            skip,
            take: limit
        });

        return {
            data: users,
            total,
            totalPages: Math.ceil(total / limit),
            limit,
            skip
        };
    } catch (error) {
        logger.error('search_users_for_friend_request_failed', {
            currentUserId,
            searchQuery,
            status_code: 500,
            error: { name: error.name, message: error.message }
        });
        throw new Error("Error searching users: " + error.message);
    }
};

export default {
    getAllUsers,
    createUser,
    deleteUserById,
    updateUserById,
    getUserById,
    getUserByName,
    searchUsersForFriendRequest
};
