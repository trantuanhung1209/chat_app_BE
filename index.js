import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRouters.js';
import friendRoutes from './routes/friendRouters.js';
import authRoutes from './routes/authRouters.js';
import { authenticateAccessToken } from './middleware.js';
import morgan from 'morgan';
import passport from "passport";
import "./config/passport.js";
import "./jobs/cleanupBlacklist.js";
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

connectDB();

// Middleware to parse JSON
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// HTTP request logger middleware
app.use(morgan('dev'));

// Passport middleware
app.use(passport.initialize());

// Serve static files from FE directory
app.use('/FE', express.static(path.join(__dirname, 'FE')));

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/users', userRoutes);
app.use('/friends', authenticateAccessToken, friendRoutes);
app.use('/auth', authRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
