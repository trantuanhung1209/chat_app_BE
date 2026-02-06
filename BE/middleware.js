import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from './services/tokenBlacklistServices.js';
import logger from './config/logger.js';

export const authenticateAccessToken = async (req, res, next) => {
    let token;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token; // Lấy token từ cookie tên 'access_token'
    }
    if (!token) {
        logger.error('auth_access_token_missing', {
            route: req.originalUrl,
            status_code: 401
        });
        return res.status(401).json({ message: 'No token provided' });
    }

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
        logger.error('auth_token_blacklisted', {
            route: req.originalUrl,
            status_code: 401
        });
        return res.status(401).json({ message: 'Token is blacklisted' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.error('auth_access_token_invalid', {
                route: req.originalUrl,
                status_code: 403,
                error: { name: err.name, message: err.message }
            });
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        logger.info('auth_access_token_success', {
            user_id: user?.id,
            route: req.originalUrl
        });
        next();
    });
};

export const authenticateRefreshToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        logger.error('auth_refresh_token_missing', {
            route: req.originalUrl,
            status_code: 401
        });
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) {
            logger.error('auth_refresh_token_invalid', {
                route: req.originalUrl,
                status_code: 403,
                error: { name: err.name, message: err.message }
            });
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        logger.info('auth_refresh_token_success', {
            user_id: user?.id,
            route: req.originalUrl
        });
        next();
    });
};


export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole || !allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase())) {
            logger.error('auth_role_forbidden', {
                user_id: req.user?.id,
                user_role: userRole,
                allowed_roles: allowedRoles,
                route: req.originalUrl,
                status_code: 403
            });
            return res.status(403).json({ message: 'Forbidden' });
        }
        logger.info('auth_role_authorized', {
            user_id: req.user?.id,
            user_role: userRole,
            route: req.originalUrl
        });
        next();
    };
}