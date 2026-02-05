import { prisma } from "../config/db.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import logger from '../config/logger.js';

const register = async (userData) => {
    try {
        // check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
        });
        
        // Nếu user đã tồn tại và có password (đăng ký thường), báo lỗi
        if (existingUser && existingUser.password) {
            logger.error('register_failed', {
                msg: 'Email already exists',
                status_code: 400,
                user_email: userData.email
            });
            throw new Error("Email already exists");
        }
        
        // Nếu user đã tồn tại nhưng không có password (từ Google), update password
        if (existingUser && !existingUser.password) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const updatedUser = await prisma.user.update({
                where: { email: userData.email },
                data: {
                    password: hashedPassword,
                    fullName: userData.fullName || existingUser.fullName
                }
            });
            
            const accessToken = jwt.sign(
                { id: updatedUser.id, fullName: updatedUser.fullName, email: updatedUser.email, role: updatedUser.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { id: updatedUser.id, fullName: updatedUser.fullName, email: updatedUser.email, role: updatedUser.role },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            logger.info('register_password_updated', {
                user_id: updatedUser.id,
                status_code: 200
            });
            return { user: updatedUser, accessToken, refreshToken };
        }

        // Tạo user mới
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await prisma.user.create({
            data: {
                fullName: userData.fullName,
                email: userData.email,
                password: hashedPassword,
                avatar: userData.avatar || null,
                typeAuth: 'EMAIL'
            }
        });

        const accessToken = jwt.sign(
            { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        logger.info('register_success', {
            user_id: user.id,
            status_code: 201
        });
        return { user, accessToken, refreshToken };
    } catch (error) {
        logger.error('register_failed', {
            status_code: 500,
            error: { name: error.name, message: error.message }
        });
        throw new Error("Error creating user: " + error.message);
    }
};

const login = async (email, password) => {
    try {
        const user = await prisma.user.findFirst({
            where: { email: email }
        });

        logger.info('login_attempt', { user_email: email });

        if (!user) {
            logger.error('login_failed', {
                msg: 'User not found',
                status_code: 401,
                user_email: email
            });
            throw new Error("Invalid username or password");
        }

        // Nếu user không có password (chỉ đăng ký qua Google)
        if (!user.password) {
            logger.error('login_failed', {
                msg: 'No password set - Google account only',
                status_code: 401,
                user_email: email
            });
            const error = new Error("NO_PASSWORD_SET");
            error.user = {
                email: user.email,
                fullName: user.fullName,
                avatar: user.avatar
            };
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.error('login_failed', {
                msg: 'Password mismatch',
                status_code: 401,
                user_email: email
            });
            throw new Error("Invalid username or password");
        }

        // Update authProvider thành EMAIL khi login
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { typeAuth: 'EMAIL' }
        });

        const accessToken = jwt.sign(
            { id: updatedUser.id, fullName: updatedUser.fullName, email: updatedUser.email, role: updatedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: updatedUser.id, fullName: updatedUser.fullName, email: updatedUser.email, role: updatedUser.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        logger.info('login_success', {
            user_id: updatedUser.id,
            auth_provider: 'EMAIL',
            status_code: 200
        });

        return { user: updatedUser, accessToken, refreshToken };
    } catch (error) {
        throw new Error("Login error: " + error.message);
    }
};


const refreshToken = async (token) => {
    try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const newAccessToken = jwt.sign(
            { id: payload.id, fullName: payload.fullName, email: payload.email, role: payload.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Tạo refresh token mới (token rotation)
        const newRefreshToken = jwt.sign(
            { id: payload.id, fullName: payload.fullName, email: payload.email, role: payload.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
        throw new Error("Invalid refresh token: " + error.message);
    }
};

const findOrCreateGoogleUser = async ({ googleId, fullName, email, avatar }) => {
    try {
        let user = await prisma.user.findFirst({
            where: { email: email }
        });

        if (!user) {
            // Tạo user mới với typeAuth GOOGLE
            user = await prisma.user.create({
                data: {
                    googleId,
                    fullName,
                    email,
                    avatar,
                    typeAuth: 'GOOGLE'
                }
            });
            logger.info('google_user_created', {
                user_id: user.id,
                status_code: 201
            });
        } else {
            // Update typeAuth thành GOOGLE khi login lại
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    typeAuth: 'GOOGLE',
                    googleId: googleId, // Update googleId nếu chưa có
                    avatar: avatar || user.avatar // Update avatar nếu Google có avatar mới
                }
            });
            logger.info('google_login_success', {
                user_id: user.id,
                auth_provider: 'GOOGLE',
                status_code: 200
            });
        }

        return user;
    } catch (error) {
        throw new Error("Error finding or creating Google user: " + error.message);
    }
};

const getUserById = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                role: true,
                typeAuth: true,
                createdAt: true,
                password: true // Lấy để check, nhưng sẽ không trả về
            }
        });
        
        if (!user) return null;
        
        // Trả về user info với flag hasPassword, không trả về password thật
        const { password, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            hasPassword: !!password // Convert to boolean
        };
    } catch (error) {
        throw new Error("Error fetching user: " + error.message);
    }
};

export default { login, register, refreshToken, findOrCreateGoogleUser, getUserById };