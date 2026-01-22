import { prisma } from "../config/db.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const register = async (userData) => {
    try {
        // check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
        });
        if (existingUser) {
            throw new Error("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await prisma.user.create({
            data: {
                fullName: userData.fullName,
                email: userData.email,
                password: hashedPassword,
                avatar: userData.avatar || null
            }
        });

        const accessToken = jwt.sign(
            { id: user.id, fullName: user.fullName, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, fullName: user.fullName, email: user.email },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return { user, accessToken, refreshToken };
    } catch (error) {
        throw new Error("Error creating user: " + error.message);
    }
};

const login = async (email, password) => {
    try {
        const user = await prisma.user.findFirst({
            where: { email: email }
        });

        console.log('Found user:', user);

        if (!user) {
            throw new Error("Invalid username or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid username or password");
        }

        const accessToken = jwt.sign(
            { id: user.id, fullName: user.fullName, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, fullName: user.fullName, email: user.email },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return { user, accessToken, refreshToken };
    } catch (error) {
        throw new Error("Login error: " + error.message);
    }
};


const refreshToken = async (token) => {
    try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const newAccessToken = jwt.sign(
            { id: payload.id, fullName: payload.fullName, email: payload.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return { accessToken: newAccessToken, refreshToken: token };
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
            user = await prisma.user.create({
                data: {
                    googleId,
                    fullName,
                    email,
                    avatar
                }
            });
        }

        return user;
    } catch (error) {
        throw new Error("Error finding or creating Google user: " + error.message);
    }
};

export default { login, register, refreshToken, findOrCreateGoogleUser};