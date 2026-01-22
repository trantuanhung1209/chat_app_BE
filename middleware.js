import jwt from 'jsonwebtoken';
import * as authServices from './services/authServices.js';
import { isTokenBlacklisted } from './services/tokenBlacklistServices.js';

export const authenticateAccessToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
        return res.status(401).json({ message: 'Token is blacklisted' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        console.log('Authenticated user:', user.payload);
        next();
    });
};

export const authenticateRefreshToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        console.log('Authenticated user:', user);
        next();
    });
};
