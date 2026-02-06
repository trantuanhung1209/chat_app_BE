import api from './api';
import { API_ENDPOINTS } from '../config/constants';
import type {
  Conversation,
  Message,
  ApiResponse,
  PaginatedResponse,
  Reaction,
} from '../types';

export const chatService = {
  // Conversations
  getConversations: async (page = 1, limit = 20): Promise<PaginatedResponse<Conversation>> => {
    const response = await api.get<ApiResponse<any>>(
      API_ENDPOINTS.CONVERSATIONS,
      { params: { page, limit } }
    );
    
    // Map backend response to frontend structure
    const backendData = response.data.data;
    return {
      data: backendData.conversations || [],
      pagination: backendData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  },

  getConversationById: async (conversationId: string): Promise<Conversation> => {
    const response = await api.get<ApiResponse<Conversation>>(
      API_ENDPOINTS.CONVERSATION_BY_ID.replace(':id', conversationId)
    );
    return response.data.data!;
  },

  createConversation: async (data: {
    type: 'direct' | 'group';
    name?: string;
    participantIds: string[];
  }): Promise<Conversation> => {
    const response = await api.post<ApiResponse<Conversation>>(
      API_ENDPOINTS.CONVERSATIONS,
      data
    );
    return response.data.data!;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.CONVERSATION_BY_ID.replace(':id', conversationId));
  },

  // Messages
  getMessages: async (
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<ApiResponse<any>>(
      API_ENDPOINTS.MESSAGES.replace(':conversationId', conversationId),
      { params: { page, limit } }
    );
    
    // Map backend response to frontend structure  
    const backendData = response.data.data;
    return {
      data: backendData.messages || [],
      pagination: backendData.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 }
    };
  },

  sendMessage: async (
    conversationId: string,
    data: {
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM';
      replyToId?: string;
      attachments?: Array<{
        filename: string;
        url: string;
        fileType: string;
        fileSize: number;
      }>;
    }
  ): Promise<Message> => {
    const response = await api.post<ApiResponse<Message>>(
      API_ENDPOINTS.SEND_MESSAGE.replace(':conversationId', conversationId),
      data
    );
    return response.data.data!;
  },

  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await api.put<ApiResponse<Message>>(
      API_ENDPOINTS.EDIT_MESSAGE.replace(':messageId', messageId),
      { content }
    );
    return response.data.data!;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.DELETE_MESSAGE.replace(':messageId', messageId));
  },

  // Reactions
  addReaction: async (messageId: string, reactionType: string): Promise<Reaction> => {
    const response = await api.post<ApiResponse<Reaction>>(
      API_ENDPOINTS.ADD_REACTION.replace(':messageId', messageId),
      { reactionType }
    );
    return response.data.data!;
  },

  removeReaction: async (messageId: string, reactionId: string): Promise<void> => {
    await api.delete(
      API_ENDPOINTS.REMOVE_REACTION
        .replace(':messageId', messageId)
        .replace(':reactionId', reactionId)
    );
  },

  // Read receipts
  markAsRead: async (messageId: string): Promise<void> => {
    await api.post(API_ENDPOINTS.MARK_AS_READ.replace(':messageId', messageId));
  },

  markConversationAsRead: async (conversationId: string): Promise<void> => {
    await api.put(
      API_ENDPOINTS.MARK_CONVERSATION_AS_READ.replace(':conversationId', conversationId)
    );
  },

  // Search
  searchMessages: async (query: string, conversationId?: string): Promise<Message[]> => {
    const response = await api.get<ApiResponse<Message[]>>(API_ENDPOINTS.SEARCH_MESSAGES, {
      params: { query, conversationId },
    });
    return response.data.data!;
  },
};
