import friendServices from '../services/friendServices.js';
import logger from '../config/logger.js';

// Xử lý các socket events liên quan đến friend - REALTIME & INDEPENDENT
export const friendSocketHandler = (io, socket) => {
  logger.info('friend_socket_initialized', {
    user_id: socket.userId,
    userName: socket.userName,
    socket_id: socket.id
  });

  // ==================== SEND FRIEND REQUEST ====================
  socket.on('send-friend-request', async (data, callback) => {
    const { toUserId } = data;
    const fromUserId = socket.userId;
    
    logger.info('friend_request_attempt', {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      socket_id: socket.id
    });

    try {
      // Validate
      if (!toUserId) {
        throw new Error('toUserId is required');
      }

      // Gọi service xử lý logic
      const request = await friendServices.sendFriendRequest(fromUserId, toUserId);
      
      // Emit đến người nhận (toUserId)
      io.to(toUserId.toString()).emit('friend-request-received', {
        requestId: request.id,
        fromUserId: fromUserId,
        fromUserName: socket.userName,
        fromUserEmail: socket.userEmail,
        status: 'pending',
        createdAt: request.createdAt,
        message: `${socket.userName} sent you a friend request`
      });
      
      logger.info('friend_request_sent', {
        request_id: request.id,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status_code: 200
      });

      // Response về cho người gửi
      if (callback) {
        callback({
          success: true,
          message: 'Friend request sent successfully',
          data: request
        });
      }

    } catch (error) {
      logger.error('friend_request_failed', {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        error: { name: error.name, message: error.message },
        status_code: 400
      });

      // Response lỗi về cho người gửi
      if (callback) {
        callback({
          success: false,
          message: error.message
        });
      }
    }
  });

  // ==================== ACCEPT FRIEND REQUEST ====================
  socket.on('accept-friend-request', async (data, callback) => {
    const { requestId } = data;
    const userId = socket.userId;
    
    logger.info('friend_request_accept_attempt', {
      user_id: userId,
      request_id: requestId,
      socket_id: socket.id
    });

    try {
      if (!requestId) {
        throw new Error('requestId is required');
      }

      // Gọi service xử lý logic
      const request = await friendServices.acceptFriendRequest(requestId);
      
      // Emit đến người gửi request (senderId)
      io.to(request.senderId.toString()).emit('friend-request-accepted', {
        requestId: requestId,
        acceptedBy: userId,
        acceptedByName: socket.userName,
        acceptedByEmail: socket.userEmail,
        status: 'accepted',
        updatedAt: request.updatedAt,
        message: `${socket.userName} accepted your friend request`
      });
      
      // Emit đến chính người accept (receiverId) để update UI
      socket.emit('friend-request-accept-success', {
        requestId: requestId,
        friendUserId: request.senderId,
        status: 'accepted',
        message: 'Friend request accepted successfully'
      });
      
      logger.info('friend_request_accepted', {
        request_id: requestId,
        accepted_by: userId,
        sender_id: request.senderId,
        status_code: 200
      });

      if (callback) {
        callback({
          success: true,
          message: 'Friend request accepted successfully',
          data: request
        });
      }

    } catch (error) {
      logger.error('friend_request_accept_failed', {
        user_id: userId,
        request_id: requestId,
        error: { name: error.name, message: error.message },
        status_code: 400
      });

      if (callback) {
        callback({
          success: false,
          message: error.message
        });
      }
    }
  });

  // ==================== REJECT FRIEND REQUEST ====================
  socket.on('reject-friend-request', async (data, callback) => {
    const { requestId } = data;
    const userId = socket.userId;
    
    logger.info('friend_request_reject_attempt', {
      user_id: userId,
      request_id: requestId,
      socket_id: socket.id
    });

    try {
      if (!requestId) {
        throw new Error('requestId is required');
      }

      const request = await friendServices.rejectFriendRequest(requestId, userId);
      
      // Emit đến người gửi request
      io.to(request.senderId.toString()).emit('friend-request-rejected', {
        requestId: requestId,
        rejectedBy: userId,
        rejectedByName: socket.userName,
        status: 'rejected',
        message: `${socket.userName} rejected your friend request`
      });
      
      // Emit đến chính người reject để update UI
      socket.emit('friend-request-reject-success', {
        requestId: requestId,
        status: 'rejected',
        message: 'Friend request rejected successfully'
      });
      
      logger.info('friend_request_rejected', {
        request_id: requestId,
        rejected_by: userId,
        sender_id: request.senderId,
        status_code: 200
      });

      if (callback) {
        callback({
          success: true,
          message: 'Friend request rejected successfully'
        });
      }

    } catch (error) {
      logger.error('friend_request_reject_failed', {
        user_id: userId,
        request_id: requestId,
        error: { name: error.name, message: error.message },
        status_code: 400
      });

      if (callback) {
        callback({
          success: false,
          message: error.message
        });
      }
    }
  });

  // ==================== CANCEL FRIEND REQUEST ====================
  socket.on('cancel-friend-request', async (data, callback) => {
    const { requestId } = data;
    const userId = socket.userId;
    
    logger.info('friend_request_cancel_attempt', {
      user_id: userId,
      request_id: requestId,
      socket_id: socket.id
    });

    try {
      if (!requestId) {
        throw new Error('requestId is required');
      }

      const request = await friendServices.cancelFriendRequest(requestId, userId);
      
      // Emit đến người nhận request
      io.to(request.receiverId.toString()).emit('friend-request-cancelled', {
        requestId: requestId,
        cancelledBy: userId,
        message: `Friend request has been cancelled`
      });
      
      // Emit đến chính người cancel
      socket.emit('friend-request-cancel-success', {
        requestId: requestId,
        message: 'Friend request cancelled successfully'
      });
      
      logger.info('friend_request_cancelled', {
        request_id: requestId,
        cancelled_by: userId,
        receiver_id: request.receiverId,
        status_code: 200
      });

      if (callback) {
        callback({
          success: true,
          message: 'Friend request cancelled successfully'
        });
      }

    } catch (error) {
      logger.error('friend_request_cancel_failed', {
        user_id: userId,
        request_id: requestId,
        error: { name: error.name, message: error.message },
        status_code: 400
      });

      if (callback) {
        callback({
          success: false,
          message: error.message
        });
      }
    }
  });

  // ==================== REMOVE FRIEND ====================
  socket.on('remove-friend', async (data, callback) => {
    const { friendId } = data;
    const userId = socket.userId;
    
    logger.info('remove_friend_attempt', {
      user_id: userId,
      friend_id: friendId,
      socket_id: socket.id
    });

    try {
      if (!friendId) {
        throw new Error('friendId is required');
      }

      await friendServices.removeFriend(userId, friendId);
      
      // Emit đến friend
      io.to(friendId.toString()).emit('friend-removed', {
        userId: userId,
        userName: socket.userName,
        message: `${socket.userName} removed you from friends`
      });
      
      // Emit đến chính user
      socket.emit('friend-remove-success', {
        friendId: friendId,
        message: 'Friend removed successfully'
      });
      
      logger.info('friend_removed', {
        user_id: userId,
        friend_id: friendId,
        status_code: 200
      });

      if (callback) {
        callback({
          success: true,
          message: 'Friend removed successfully'
        });
      }

    } catch (error) {
      logger.error('remove_friend_failed', {
        user_id: userId,
        friend_id: friendId,
        error: { name: error.name, message: error.message },
        status_code: 400
      });

      if (callback) {
        callback({
          success: false,
          message: error.message
        });
      }
    }
  });

  // ==================== USER STATUS ====================
  socket.on('user:online', () => {
    logger.info('user_status_change', {
      user_id: socket.userId,
      status: 'online',
      socket_id: socket.id
    });

    socket.broadcast.emit('user-online', {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date()
    });
  });
  
  socket.on('user:offline', () => {
    logger.info('user_status_change', {
      user_id: socket.userId,
      status: 'offline',
      socket_id: socket.id
    });

    socket.broadcast.emit('user-offline', {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date()
    });
  });
};