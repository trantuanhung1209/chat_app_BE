import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRouters.js';
import friendRoutes from './routes/friendRouters.js';
import authRoutes from './routes/authRouters.js';
import passwordResetRoutes from './routes/passwordResetRouters.js';
import changePasswordRoutes from './routes/changePasswordRouters.js';
import { authenticateAccessToken } from './middleware.js';
import morgan from 'morgan';
import passport from "passport";
import "./config/passport.js";
import "./jobs/cleanupBlacklist.js";
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { createServer } from "http";
import { socketAuthMiddleware } from './middleware/socketMiddleware.js';
import { initializeSocketHandlers } from './sockets/index.js';
import { initializeSocket } from './services/socketHelperServices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const API_PORT = 3000;
const SOCKET_PORT = 4000;

connectDB();

// ================= SOCKET SERVER (port 4000) =================
const socketHttpServer = createServer();

const io = new Server(socketHttpServer, {
  cors: {
    origin: "*",
  },
});

// Initialize socket helper service
initializeSocket(io);

// Socket authentication middleware
// io.use(socketAuthMiddleware); // Tạm tắt để test

// Initialize tất cả socket handlers
initializeSocketHandlers(io);

socketHttpServer.listen(SOCKET_PORT, () => {
  console.log(`⚡ Socket server running at http://localhost:${SOCKET_PORT}`);
});

// ================= EXPRESS MIDDLEWARE =================
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

// Static FE
app.use('/FE', express.static(path.join(__dirname, 'FE')));

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Routes
app.use('/users', userRoutes);
app.use('/friends', authenticateAccessToken, friendRoutes);
app.use('/auth', authRoutes);
app.use('/password-reset', passwordResetRoutes);
app.use('/change-password', changePasswordRoutes);

// ================= EXPRESS SERVER (port 3000) =================
app.listen(API_PORT, () => {
  console.log(`🚀 API server running at http://localhost:${API_PORT}`);
});

export { io };