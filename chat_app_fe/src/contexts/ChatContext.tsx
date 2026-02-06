import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { chatService } from '../services/chat.service';
import socketService from '../services/socket.service';
import type { Conversation, Message } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: Map<string, string[]>;
  
  setActiveConversation: (conversation: Conversation | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (content: string, conversationId: string) => Promise<Message>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  sendTyping: (conversationId: string) => void;
  sendStopTyping: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const response = await chatService.getConversations();
      // Normalize backend data to match frontend types
      const normalizedConversations = (response.data || []).map(conv => ({
        ...conv,
        type: conv.isGroup ? 'group' as const : 'direct' as const
      }));
      setConversations(normalizedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string, page = 1) => {
    setIsLoadingMessages(true);
    try {
      const response = await chatService.getMessages(conversationId, page);
      const messageData = response.data || [];
      if (page === 1) {
        setMessages(messageData.reverse());
      } else {
        setMessages((prev) => [...messageData.reverse(), ...prev]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation, loadMessages]);

  // Setup socket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // New message
    socketService.onNewMessage((data) => {
      const { message, conversationId } = data;
      
      // Add to messages if it's for active conversation
      if (activeConversation?.id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
      
      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: message, unreadCount: (conv.unreadCount || 0) + 1 }
            : conv
        )
      );
    });

    // Message updated
    socketService.onMessageUpdated((data) => {
      const { message } = data;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? message : msg))
      );
    });

    // Message deleted
    socketService.onMessageDeleted((data) => {
      const { messageId } = data;
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    // Typing events
    socketService.onUserTyping((data) => {
      const { conversationId, userId, userName } = data;
      if (userId === user?.id) return; // Don't show own typing
      
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const users = newMap.get(conversationId) || [];
        if (!users.includes(userName)) {
          newMap.set(conversationId, [...users, userName]);
        }
        return newMap;
      });
    });

    socketService.onUserStopTyping((data) => {
      const { conversationId, userName } = data;
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const users = newMap.get(conversationId) || [];
        newMap.set(
          conversationId,
          users.filter((u) => u !== userName)
        );
        return newMap;
      });
    });

    return () => {
      socketService.off('chat:new_message');
      socketService.off('chat:message_updated');
      socketService.off('chat:message_deleted');
      socketService.off('chat:user_typing');
      socketService.off('chat:user_stop_typing');
    };
  }, [isAuthenticated, activeConversation, user]);

  const sendMessage = async (content: string, conversationId: string) => {
    try {
      const newMessage = await chatService.sendMessage(conversationId, {
        content,
        type: 'TEXT',
      });
      
      // Add message to state immediately (optimistic update)
      if (activeConversation?.id === conversationId) {
        setMessages((prev) => [...prev, newMessage]);
      }
      
      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
            : conv
        )
      );
      
      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    try {
      const updatedMessage = await chatService.editMessage(messageId, content);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updatedMessage : msg))
      );
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };

  const sendTyping = (conversationId: string) => {
    socketService.sendTyping(conversationId);
  };

  const sendStopTyping = (conversationId: string) => {
    socketService.sendStopTyping(conversationId);
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await chatService.markConversationAsRead(conversationId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        typingUsers,
        setActiveConversation,
        loadConversations,
        loadMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        sendTyping,
        sendStopTyping,
        markConversationAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
