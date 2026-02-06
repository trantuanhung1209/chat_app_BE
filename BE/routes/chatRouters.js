import express from 'express';
import chatController from '../controllers/chatController.js';
import { authenticateAccessToken } from '../middleware.js';

const router = express.Router();

// Conversation routes
router.get('/conversations', authenticateAccessToken, chatController.getConversations);
router.get('/conversations/:conversationId', authenticateAccessToken, chatController.getConversationById);
router.post('/conversations', authenticateAccessToken, chatController.createConversation);
router.put('/conversations/:conversationId', authenticateAccessToken, chatController.updateConversation);
router.delete('/conversations/:conversationId', authenticateAccessToken, chatController.deleteConversation);

// Participant routes
router.post('/conversations/:conversationId/participants', authenticateAccessToken, chatController.addParticipants);
router.delete('/conversations/:conversationId/participants/:userId', authenticateAccessToken, chatController.removeParticipant);
router.post('/conversations/:conversationId/leave', authenticateAccessToken, chatController.leaveConversation);
router.put('/conversations/:conversationId/participants/:userId/role', authenticateAccessToken, chatController.updateParticipantRole);

// Message routes
router.get('/conversations/:conversationId/messages', authenticateAccessToken, chatController.getMessages);
router.post('/conversations/:conversationId/messages', authenticateAccessToken, chatController.sendMessage);
router.put('/messages/:messageId', authenticateAccessToken, chatController.editMessage);
router.delete('/messages/:messageId', authenticateAccessToken, chatController.deleteMessage);

// Reaction routes
router.post('/messages/:messageId/reactions', authenticateAccessToken, chatController.addReaction);
router.delete('/messages/:messageId/reactions/:reactionId', authenticateAccessToken, chatController.removeReaction);

// Read receipt routes
router.post('/messages/:messageId/read', authenticateAccessToken, chatController.markAsRead);
router.put('/conversations/:conversationId/read', authenticateAccessToken, chatController.markConversationAsRead);

// Search routes
router.get('/search/messages', authenticateAccessToken, chatController.searchMessages);
router.get('/search/conversations', authenticateAccessToken, chatController.searchConversations);

export default router;