// FE/js/socket.js
import { SOCKET_URL } from './config.js';
import { showToast } from './utils.js';

let socket = null;

// Initialize Socket Connection
export function initSocket() {
  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('userId');
  
  if (!token || !userId) {
    console.log('No token or userId found, skipping socket connection');
    return null;
  }

  // Connect to socket server with authentication
  socket = io(SOCKET_URL, {
    auth: {
      token: token,
      userId: userId
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('user:online');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server forcefully disconnected, try to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    if (error.message.includes('Authentication error')) {
      showToast('Lỗi xác thực socket. Vui lòng đăng nhập lại.', 'error');
    }
  });

  setupSocketListeners();
  return socket;
}

// Setup all socket event listeners
function setupSocketListeners() {
  // Chat events
  socket.on('receive-message', handleNewMessage);
  socket.on('user-typing', handleUserTyping);

  // Friend events - Đồng bộ với backend controllers
  socket.on('friend-request-received', handleNewFriendRequest);
  socket.on('friend-request-accepted', handleFriendRequestAccepted);
  socket.on('friend-request-rejected', handleFriendRequestRejected);
  socket.on('friend-request-cancelled', handleFriendRequestCancelled);
  socket.on('friend-removed', handleFriendRemoved);
  socket.on('friend-blocked', handleFriendBlocked);

  // User status events
  socket.on('user-online', handleUserOnline);
  socket.on('user-offline', handleUserOffline);
  
  console.log('✅ All socket event listeners registered');
}

// ===== CHAT HANDLERS =====
function handleNewMessage(data) {
  console.log('New message received:', data);
  // Dispatch custom event for chat component to handle
  window.dispatchEvent(new CustomEvent('socketNewMessage', { detail: data }));
}

function handleChatNotification(data) {
  console.log('Chat notification:', data);
  showToast('Tin nhắn mới từ người dùng ' + data.senderId, 'info');
  // Update unread count, show notification badge, etc.
  window.dispatchEvent(new CustomEvent('socketChatNotification', { detail: data }));
}

function handleUserTyping(data) {
  window.dispatchEvent(new CustomEvent('socketUserTyping', { detail: data }));
}

function handleChatError(data) {
  showToast(data.message || 'Lỗi khi gửi tin nhắn', 'error');
}

// ===== FRIEND HANDLERS =====
function handleNewFriendRequest(data) {
  console.log('📥 New friend request received:', data);
  showToast(data.message || `${data.fromUserName} gửi lời mời kết bạn`, 'info');
  window.dispatchEvent(new CustomEvent('socketNewFriendRequest', { detail: data }));
}

function handleFriendRequestAccepted(data) {
  console.log('✅ Friend request accepted:', data);
  showToast(data.message || 'Lời mời kết bạn đã được chấp nhận!', 'success');
  window.dispatchEvent(new CustomEvent('socketFriendRequestAccepted', { detail: data }));
}

function handleFriendRequestRejected(data) {
  console.log('❌ Friend request rejected:', data);
  showToast(data.message || 'Lời mời kết bạn đã bị từ chối', 'warning');
  window.dispatchEvent(new CustomEvent('socketFriendRequestRejected', { detail: data }));
}

function handleFriendRequestCancelled(data) {
  console.log('🚫 Friend request cancelled:', data);
  showToast(data.message || 'Lời mời kết bạn đã bị hủy', 'info');
  window.dispatchEvent(new CustomEvent('socketFriendRequestCancelled', { detail: data }));
}

function handleFriendRemoved(data) {
  console.log('👋 Friend removed:', data);
  showToast(data.message || 'Bạn đã bị xóa khỏi danh sách bạn bè', 'warning');
  window.dispatchEvent(new CustomEvent('socketFriendRemoved', { detail: data }));
}

function handleFriendBlocked(data) {
  console.log('🚫 Friend blocked:', data);
  showToast(data.message || 'Bạn đã bị chặn', 'error');
  window.dispatchEvent(new CustomEvent('socketFriendBlocked', { detail: data }));
}

// ===== USER STATUS HANDLERS =====
function handleUserOnline(data) {
  console.log('👁️ User online:', data);
  window.dispatchEvent(new CustomEvent('socketUserOnline', { detail: data }));
}

function handleUserOffline(data) {
  console.log('💤 User offline:', data);
  window.dispatchEvent(new CustomEvent('socketUserOffline', { detail: data }));
}

// ===== PUBLIC API =====

// Disconnect socket
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Get socket instance
export function getSocket() {
  return socket;
}

// Join chat room
export function joinChatRoom(recipientId) {
  if (socket && socket.connected) {
    socket.emit('chat:join', { recipientId });
  }
}

// Send message
export function emitSendMessage(recipientId, message) {
  if (socket && socket.connected) {
    socket.emit('chat:sendMessage', { recipientId, message });
  } else {
    showToast('Không thể gửi tin nhắn. Kết nối socket bị ngắt.', 'error');
  }
}

// Typing indicator
export function emitTyping(recipientId, isTyping) {
  if (socket && socket.connected) {
    socket.emit('chat:typing', { recipientId, isTyping });
  }
}

// Mark messages as read
export function emitMarkAsRead(messageIds) {
  if (socket && socket.connected) {
    socket.emit('chat:markAsRead', { messageIds });
  }
}

// Get online users
export function requestOnlineUsers() {
  if (socket && socket.connected) {
    socket.emit('user:getOnlineUsers');
  }
}

// Notify friend request sent
export function emitFriendRequestSent(toUserId) {
  if (socket && socket.connected) {
    socket.emit('friend-request-sent', { toUserId });
    console.log('📤 Emitted friend-request-sent to:', toUserId);
  }
}