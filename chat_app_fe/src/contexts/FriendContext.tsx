import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { friendService } from '../services/friend.service';
import type { Friend, FriendRequest, User } from '../types';
import { useAuth } from './AuthContext';

interface FriendContextType {
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  isLoadingFriends: boolean;
  isLoadingIncoming: boolean;
  isLoadingOutgoing: boolean;
  
  loadFriends: () => Promise<void>;
  loadIncomingRequests: () => Promise<void>;
  loadOutgoingRequests: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(false);
  const [isLoadingOutgoing, setIsLoadingOutgoing] = useState(false);

  const loadFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Failed to load friends:', error);
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  const loadIncomingRequests = useCallback(async () => {
    setIsLoadingIncoming(true);
    try {
      const data = await friendService.getIncomingRequests();
      setIncomingRequests(data);
    } catch (error) {
      console.error('Failed to load incoming requests:', error);
      setIncomingRequests([]);
    } finally {
      setIsLoadingIncoming(false);
    }
  }, []);

  const loadOutgoingRequests = useCallback(async () => {
    setIsLoadingOutgoing(true);
    try {
      const data = await friendService.getOutgoingRequests();
      setOutgoingRequests(data);
    } catch (error) {
      console.error('Failed to load outgoing requests:', error);
      setOutgoingRequests([]);
    } finally {
      setIsLoadingOutgoing(false);
    }
  }, []);

  // Load friends on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadFriends();
    }
  }, [isAuthenticated, loadFriends]);

  const sendFriendRequest = async (receiverId: string) => {
    try {
      await friendService.sendFriendRequest(receiverId);
      // Could add optimistic update or notification here
    } catch (error) {
      console.error('Failed to send friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      // Remove from incoming requests and reload friends
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
      await loadFriends();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await friendService.rejectFriendRequest(requestId);
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      throw error;
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await friendService.removeFriend(friendId);
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      return await friendService.searchUsers(query);
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  };

  return (
    <FriendContext.Provider
      value={{
        friends,
        incomingRequests,
        outgoingRequests,
        isLoadingFriends,
        isLoadingIncoming,
        isLoadingOutgoing,
        loadFriends,
        loadIncomingRequests,
        loadOutgoingRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        searchUsers,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFriend = () => {
  const context = useContext(FriendContext);
  if (context === undefined) {
    throw new Error('useFriend must be used within a FriendProvider');
  }
  return context;
};
