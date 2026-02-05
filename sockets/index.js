import { friendSocketHandler } from './friendSocket.js';
import logger from '../config/logger.js';

export const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Đọc userId và userName từ query params (tạm thời để test)
    const userId = socket.handshake.query.userId || socket.handshake.auth.userId;
    const userName = socket.handshake.query.userName || socket.handshake.auth.userName || 'Anonymous';
    const userEmail = socket.handshake.query.userEmail || socket.handshake.auth.userEmail;
    
    // Gán vào socket object
    socket.userId = userId;
    socket.userName = userName;
    socket.userEmail = userEmail;
    
    logger.info('socket_connected', {
      user_id: socket.userId,
      userName: socket.userName,
      socket_id: socket.id
    });
    
    // Join room với userId của chính mình để nhận events
    if (socket.userId) {
      socket.join(socket.userId.toString());
      logger.info('user_joined_room', {
        user_id: socket.userId,
        userName: socket.userName,
        room: socket.userId.toString()
      });
    }

    // Initialize tất cả socket handlers
    friendSocketHandler(io, socket);

    // Global disconnect handler
    socket.on('disconnect', () => {
      logger.info('socket_disconnected', {
        user_id: socket.userId,
        userName: socket.userName,
        socket_id: socket.id
      });
      
      // Broadcast user offline
      socket.broadcast.emit('user-offline', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      });
    });
  });
};