import api from './api';
import { API_ENDPOINTS } from '../config/constants';
import type { Friend, FriendRequest, User, ApiResponse } from '../types';

export const friendService = {
  // Get all friends
  getFriends: async (): Promise<Friend[]> => {
    const response = await api.get<ApiResponse<Friend[]>>(API_ENDPOINTS.FRIENDS);
    return response.data.data || [];
  },

  // Get friend requests (deprecated - API không tồn tại)
  // Sử dụng getIncomingRequests() hoặc getOutgoingRequests() thay thế
  getFriendRequests: async (): Promise<FriendRequest[]> => {
    console.warn('getFriendRequests is deprecated. Use getIncomingRequests() or getOutgoingRequests() instead.');
    return [];
  },

  // Get incoming friend requests (dành cho tab "Nhận được")
  getIncomingRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get<ApiResponse<FriendRequest[]>>(
      API_ENDPOINTS.FRIEND_REQUESTS_INCOMING
    );
    return response.data.data || [];
  },

  // Get outgoing friend requests (dành cho tab "Đã gửi")
  getOutgoingRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get<ApiResponse<FriendRequest[]>>(
      API_ENDPOINTS.FRIEND_REQUESTS_OUTGOING
    );
    return response.data.data || [];
  },

  // Send friend request
  sendFriendRequest: async (receiverId: string): Promise<FriendRequest> => {
    const response = await api.post<ApiResponse<FriendRequest>>(
      API_ENDPOINTS.SEND_REQUEST,
      { toUserId: receiverId }
    );
    return response.data.data!;
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string): Promise<void> => {
    await api.post(
      API_ENDPOINTS.ACCEPT_REQUEST,
      { requestId }
    );
  },

  // Reject friend request
  rejectFriendRequest: async (requestId: string): Promise<void> => {
    await api.post(
      API_ENDPOINTS.REJECT_REQUEST,
      { requestId }
    );
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<void> => {
    await api.post(API_ENDPOINTS.REMOVE_FRIEND, { friendId });
  },

  // Search users
  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>(
      API_ENDPOINTS.SEARCH_USERS,
      { params: { q: query } }
    );
    return response.data.data || [];
  },
};
