import chatServices from '../services/chatServices.js';
import logger from '../config/logger.js';

export const initializeChatSocket = (io) => {
    io.on('connection', (socket) => {
        // Lấy user info từ middleware đã attach
        const userId = socket.userId || socket.user?.id;
        const userName = socket.userName || socket.user?.fullName;

        if (!userId) {
            logger.warn('chat_socket_no_user', { socket_id: socket.id });
            socket.disconnect(true);
            return;
        }

        logger.info('chat_socket_connected', {
            user_id: userId,
            user_name: userName,
            socket_id: socket.id
        });

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Broadcast user online status
        io.emit('user:online', {
            userId,
            userName,
            timestamp: new Date()
        });

        // Join all user's conversations
        socket.on('chat:join_conversations', async () => {
            try {
                const { conversations } = await chatServices.getConversations(userId, 1, 100);
                
                conversations.forEach(conv => {
                    socket.join(`conversation:${conv.id}`);
                });
                
                logger.info('chat_conversations_joined', {
                    user_id: userId,
                    conversation_count: conversations.length
                });
                
                socket.emit('chat:conversations_joined', { 
                    success: true,
                    count: conversations.length,
                    conversations: conversations.map(c => c.id)
                });
            } catch (error) {
                logger.error('chat_join_conversations_error', {
                    user_id: userId,
                    error: error.message
                });
                socket.emit('chat:error', {
                    event: 'join_conversations',
                    message: error.message
                });
            }
        });

        // User typing event
        socket.on('chat:typing', (data) => {
            const { conversationId } = data;
            
            if (!conversationId) {
                return socket.emit('chat:error', {
                    event: 'typing',
                    message: 'conversationId is required'
                });
            }
            
            socket.to(`conversation:${conversationId}`).emit('chat:user_typing', {
                userId,
                userName,
                conversationId,
                timestamp: new Date()
            });
            
            logger.debug('chat_typing', {
                user_id: userId,
                conversation_id: conversationId
            });
        });

        // User stop typing event
        socket.on('chat:stop_typing', (data) => {
            const { conversationId } = data;
            
            if (!conversationId) {
                return socket.emit('chat:error', {
                    event: 'stop_typing',
                    message: 'conversationId is required'
                });
            }
            
            socket.to(`conversation:${conversationId}`).emit('chat:user_stop_typing', {
                userId,
                userName,
                conversationId,
                timestamp: new Date()
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            logger.info('chat_socket_disconnected', {
                user_id: userId,
                user_name: userName,
                socket_id: socket.id
            });
            
            // Broadcast user offline
            io.emit('user:offline', {
                userId,
                userName,
                timestamp: new Date()
            });
        });

        // Error handler
        socket.on('error', (error) => {
            logger.error('chat_socket_error', {
                user_id: userId,
                error: error.message,
                socket_id: socket.id
            });
        });
    });
};