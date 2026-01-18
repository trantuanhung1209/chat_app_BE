import { validateLogin, validateUser } from "../dtos/auth.js";
import authServices from "../services/authServices.js";

const register = async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).json({ errors: error.details.map(e => e.message) });
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
            maxAge: 3600000 // 1 hour
        });

        res.cookie('refresh_token', createdUser.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 3600000 // 7 days
        });

        res.status(201).json({ message: 'User registered successfully', user: createdUser.user, accessToken: createdUser.accessToken, refreshToken: createdUser.refreshToken });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
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
            maxAge: 3600000 // 1 hour
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 3600000 // 7 days
        });

        res.status(200).json({ message: 'Login successful', user: resUser, accessToken, refreshToken });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logout = (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logout successful' });
};

const refreshToken = (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const newTokens = authServices.refreshToken(refreshToken);
        res.cookie('access_token', newTokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour
        });

        res.cookie('refresh_token', newTokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 3600000 // 7 days
        });

        res.status(200).json({ accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default { register, login, logout, refreshToken };