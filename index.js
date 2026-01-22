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

const app = express();
const port = 3000;

connectDB();

// Middleware to parse JSON
app.use(express.json());

// HTTP request logger middleware
app.use(morgan('dev'));

// Passport middleware
app.use(passport.initialize());

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
