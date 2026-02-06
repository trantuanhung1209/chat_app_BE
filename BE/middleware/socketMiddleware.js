import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import { prisma } from '../config/db.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Lấy token từ auth, query, hoặc cookies
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    // Nếu không có token trong auth/query, thử parse từ cookies
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie
        .split(';')
        .map(cookie => cookie.trim())
        .reduce((acc, cookie) => {
          const [key, value] = cookie.split('=');
          acc[key] = value;
          return acc;
        }, {});
      
      token = cookies.access_token;
    }
    
    if (!token) {
      logger.warn('socket_no_token', {
        socket_id: socket.id,
        ip: socket.handshake.address
      });
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return next(new Error('Authentication error: Invalid token payload'));
    }
    
    // Lấy thông tin user từ database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        isOnline: true
      }
    });
    
    if (!user) {
      logger.warn('socket_user_not_found', {
        user_id: decoded.id,
        socket_id: socket.id
      });
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user info to socket
    socket.userId = user.id;
    socket.userEmail = user.email;
    socket.userName = user.fullName;
    socket.userAvatar = user.avatar;
    socket.userRole = user.role;
    socket.user = user; // Full user object
    
    logger.info('socket_authenticated', {
      user_id: user.id,
      user_name: user.fullName,
      socket_id: socket.id,
      ip: socket.handshake.address
    });
    
    // Update user online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() }
    });
    
    next();
    
  } catch (err) {
    logger.error('socket_auth_error', {
      error: err.message,
      socket_id: socket.id
    });
    
    if (err.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    } else if (err.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    return next(new Error('Authentication error: ' + err.message));
  }
};

// Middleware để handle disconnect và update status
export const socketDisconnectHandler = (io) => {
  io.on('connection', (socket) => {
    socket.on('disconnect', async () => {
      try {
        if (socket.userId) {
          // Update user offline status
          await prisma.user.update({
            where: { id: socket.userId },
            data: { 
              isOnline: false, 
              lastSeen: new Date() 
            }
          });
          
          logger.info('socket_disconnected', {
            user_id: socket.userId,
            user_name: socket.userName,
            socket_id: socket.id
          });
          
          // Broadcast user offline to friends/conversations
          io.emit('user:status_changed', {
            userId: socket.userId,
            isOnline: false,
            lastSeen: new Date()
          });
        }
      } catch (error) {
        logger.error('socket_disconnect_error', {
          user_id: socket.userId,
          error: error.message
        });
      }
    });
  });
};