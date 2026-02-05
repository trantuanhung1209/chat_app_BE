import { validateLogin, validateUser } from "../dtos/auth.js";
import authServices from "../services/authServices.js";
import jwt from 'jsonwebtoken';
import { addTokenToBlacklist } from "../services/tokenBlacklistServices.js";
import { successResponse, errorResponse } from '../helpers/responseHelper.js';

const register = async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        return errorResponse(res, 400, 'Validation failed', error.details.map(e => e.message));
    }

    try {
        const { fullName, email, password, avatar } = req.body;
        const newUser = {
            fullName, email, password, avatar
        }
        const createdUser = await authServices.register(newUser);

        // Set token vào cookie
        res.cookie('access_token', createdUser.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 3600000 // 1 hour
        });

        res.cookie('refresh_token', createdUser.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 3600000 // 7 days
        });

        return successResponse(res, 201, 'User registered successfully', {
            userId: createdUser.user.id,
            accessToken: createdUser.accessToken,
            refreshToken: createdUser.refreshToken
        });

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const login = async (req, res) => {
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            return errorResponse(res, 400, error.details[0].message);
        }

        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authServices.login(email, password);

        const resUser = {
            fullName: user.fullName,
            email: user.email,
            avatar: user.avatar
        }

        // Set token vào cookie
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 3600000 // 1 hour
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 3600000 // 7 days
        });

        return successResponse(res, 200, 'Login successful', {
            userId: user.id,
        });

    } catch (error) {
        // Nếu là lỗi NO_PASSWORD_SET, trả về thông tin user để redirect sang đăng ký
        if (error.message === 'NO_PASSWORD_SET') {
            return errorResponse(res, 401, error.message, { needSetPassword: true, user: error.user });
        }
        return errorResponse(res, 500, error.message);
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await authServices.getUserById(userId);
        if (user) {
            return successResponse(res, 200, 'User retrieved successfully', user);
        } else {
            return errorResponse(res, 404, `User with id ${userId} not found`);
        }
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const logout = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);
        await addTokenToBlacklist(token, expiresAt);
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return successResponse(res, 200, 'Logout successful');
};

const refreshToken = async (req, res) => {
    try {
        // Lấy refresh token từ cookie hoặc body
        let refreshToken = req.cookies.refresh_token;
        
        if (!refreshToken && req.body.refreshToken) {
            refreshToken = req.body.refreshToken;
        }
        
        if (!refreshToken) {
            return errorResponse(res, 401, 'No refresh token provided');
        }

        const newTokens = await authServices.refreshToken(refreshToken);
        res.cookie('access_token', newTokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 3600000 // 1 hour
        });

        res.cookie('refresh_token', newTokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 3600000 // 7 days
        });

        return successResponse(res, 200, 'Token refreshed successfully');
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const googleOAuthCallback = async (req, res) => {
    const { displayName, emails, photos, id } = req.user;
    const email = emails[0].value;
    const avatar = photos[0].value;

    let user = await authServices.findOrCreateGoogleUser({ googleId: id, fullName: displayName, email, avatar });

    const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600000
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 3600000
    });

    // Redirect về FE với flag needSetPassword nếu cần (cookies đã được set)
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const needSetPassword = !user.password ? 'true' : 'false';
    return res.redirect(`${frontendURL}/FE/login.html?needSetPassword=${needSetPassword}`);
};

export default { register, login, logout, refreshToken, googleOAuthCallback, getMe };