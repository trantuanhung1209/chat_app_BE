// Service để quản lý socket instance và emit events
let io = null;

// Initialize socket instance từ index.js
export const initializeSocket = (socketIO) => {
  io = socketIO;
  console.log('✅ Socket service initialized');
};

// Lấy io instance
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO chưa được khởi tạo!');
  }
  return io;
};

// Helper để emit đến 1 user cụ thể bằng userId
export const emitToUser = (userId, eventName, data) => {
  if (!io) {
    console.warn('⚠️ Socket.IO chưa sẵn sàng');
    return;
  }
  io.to(userId.toString()).emit(eventName, {
    ...data,
    timestamp: new Date()
  });
  console.log(`📤 Emitted "${eventName}" to user ${userId}`);
};

// Helper để emit đến tất cả users
export const emitToAll = (eventName, data) => {
  if (!io) {
    console.warn('⚠️ Socket.IO chưa sẵn sàng');
    return;
  }
  io.emit(eventName, {
    ...data,
    timestamp: new Date()
  });
  console.log(`📤 Emitted "${eventName}" to all users`);
};

// Helper để emit đến 1 room cụ thể
export const emitToRoom = (roomId, eventName, data) => {
  if (!io) {
    console.warn('⚠️ Socket.IO chưa sẵn sàng');
    return;
  }
  io.to(roomId).emit(eventName, {
    ...data,
    timestamp: new Date()
  });
  console.log(`📤 Emitted "${eventName}" to room ${roomId}`);
};
