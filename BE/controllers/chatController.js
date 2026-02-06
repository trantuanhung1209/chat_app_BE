import chatServices from '../services/chatServices.js';
import { successResponse, errorResponse } from '../helpers/responseHelper.js';
import { validateCreateConversation, validateSendMessage, validateAddParticipants } from '../dtos/chat.js';

// ==================== CONVERSATION ====================
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        
        const conversations = await chatServices.getConversations(userId, parseInt(page), parseInt(limit));
        return successResponse(res, 200, 'Conversations retrieved successfully', conversations);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getConversationById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        
        const conversation = await chatServices.getConversationById(conversationId, userId);
        return successResponse(res, 200, 'Conversation retrieved successfully', conversation);
    } catch (error) {
        return errorResponse(res, error.message === 'Conversation not found' ? 404 : 500, error.message);
    }
};

const createConversation = async (req, res) => {
    const { error } = validateCreateConversation(req.body);
    if (error) {
        return errorResponse(res, 400, 'Validation failed', error.details.map(e => e.message));
    }

    try {
        const userId = req.user.id;
        const conversationData = { ...req.body, createdBy: userId };
        
        const conversation = await chatServices.createConversation(conversationData);
        return successResponse(res, 201, 'Conversation created successfully', conversation);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const updateConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { name, avatar } = req.body;
        
        const conversation = await chatServices.updateConversation(conversationId, userId, { name, avatar });
        return successResponse(res, 200, 'Conversation updated successfully', conversation);
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        
        await chatServices.deleteConversation(conversationId, userId);
        return successResponse(res, 200, 'Conversation deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

// ==================== PARTICIPANTS ====================
const addParticipants = async (req, res) => {
    const { error } = validateAddParticipants(req.body);
    if (error) {
        return errorResponse(res, 400, 'Validation failed', error.details.map(e => e.message));
    }

    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { userIds } = req.body;
        
        const participants = await chatServices.addParticipants(conversationId, userId, userIds);
        return successResponse(res, 200, 'Participants added successfully', participants);
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

const removeParticipant = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { conversationId, userId } = req.params;
        
        await chatServices.removeParticipant(conversationId, adminId, userId);
        return successResponse(res, 200, 'Participant removed successfully');
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

const leaveConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        
        await chatServices.leaveConversation(conversationId, userId);
        return successResponse(res, 200, 'Left conversation successfully');
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const updateParticipantRole = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { conversationId, userId } = req.params;
        const { role } = req.body;
        
        if (!['ADMIN', 'MEMBER'].includes(role)) {
            return errorResponse(res, 400, 'Invalid role');
        }
        
        const participant = await chatServices.updateParticipantRole(conversationId, adminId, userId, role);
        return successResponse(res, 200, 'Participant role updated successfully', participant);
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

// ==================== MESSAGES ====================
const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { page = 1, limit = 50, before } = req.query;
        
        const messages = await chatServices.getMessages(
            conversationId, 
            userId, 
            parseInt(page), 
            parseInt(limit),
            before
        );
        return successResponse(res, 200, 'Messages retrieved successfully', messages);
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

const sendMessage = async (req, res) => {
    const { error } = validateSendMessage(req.body);
    if (error) {
        return errorResponse(res, 400, 'Validation failed', error.details.map(e => e.message));
    }

    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const messageData = { ...req.body, senderId: userId };
        
        const message = await chatServices.sendMessage(conversationId, messageData);
        return successResponse(res, 201, 'Message sent successfully', message);
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

const editMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const { content } = req.body;
        
        const message = await chatServices.editMessage(messageId, userId, content);
        return successResponse(res, 200, 'Message edited successfully', message);
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

const deleteMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        
        await chatServices.deleteMessage(messageId, userId);
        return successResponse(res, 200, 'Message deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

// ==================== REACTIONS ====================
const addReaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        const { emoji } = req.body;
        
        if (!emoji) {
            return errorResponse(res, 400, 'Emoji is required');
        }
        
        const reaction = await chatServices.addReaction(messageId, userId, emoji);
        return successResponse(res, 201, 'Reaction added successfully', reaction);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const removeReaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId, reactionId } = req.params;
        
        await chatServices.removeReaction(reactionId, messageId, userId);
        return successResponse(res, 200, 'Reaction removed successfully');
    } catch (error) {
        return errorResponse(res, error.message.includes('not found') ? 404 : 403, error.message);
    }
};

// ==================== READ RECEIPTS ====================
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;
        
        const receipt = await chatServices.markAsRead(messageId, userId);
        return successResponse(res, 200, 'Message marked as read', receipt);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const markConversationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        
        await chatServices.markConversationAsRead(conversationId, userId);
        return successResponse(res, 200, 'Conversation marked as read');
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

// ==================== SEARCH ====================
const searchMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { query, conversationId, page = 1, limit = 20 } = req.query;
        
        if (!query) {
            return errorResponse(res, 400, 'Search query is required');
        }
        
        const messages = await chatServices.searchMessages(userId, query, conversationId, parseInt(page), parseInt(limit));
        return successResponse(res, 200, 'Messages found', messages);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const searchConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { query, page = 1, limit = 20 } = req.query;
        
        if (!query) {
            return errorResponse(res, 400, 'Search query is required');
        }
        
        const conversations = await chatServices.searchConversations(userId, query, parseInt(page), parseInt(limit));
        return successResponse(res, 200, 'Conversations found', conversations);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

export default {
    getConversations,
    getConversationById,
    createConversation,
    updateConversation,
    deleteConversation,
    addParticipants,
    removeParticipant,
    leaveConversation,
    updateParticipantRole,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    markConversationAsRead,
    searchMessages,
    searchConversations
};