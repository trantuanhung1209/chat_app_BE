import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { chatService } from '../services/chat.service';
import socketService from '../services/socket.service';
import type { Conversation, Message } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  pinnedMessages: Message[];
  replyToMessage: Message | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: Map<string, string[]>;
  
  setActiveConversation: (conversation: Conversation | null) => void;
  setReplyToMessage: (message: Message | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  loadPinnedMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, conversationId: string, replyToId?: string) => Promise<Message>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  unpinMessage: (messageId: string) => Promise<void>;
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
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
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

  const loadPinnedMessages = useCallback(async (conversationId: string) => {
    try {
      const pinnedMsgs = await chatService.getPinnedMessages(conversationId);
      setPinnedMessages(pinnedMsgs);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
      setPinnedMessages([]);
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
      loadPinnedMessages(activeConversation.id);
      setReplyToMessage(null); // Clear reply when switching conversations
    } else {
      setMessages([]);
      setPinnedMessages([]);
      setReplyToMessage(null);
    }
  }, [activeConversation, loadMessages, loadPinnedMessages]);

  // Setup socket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // New message
    socketService.onNewMessage((data) => {
      const { message, conversationId } = data;
      
      // Skip if this message was sent by current user (already added via optimistic update)
      if (message.senderId === user?.id) return;
      
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
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    // Message pinned
    socketService.onMessagePinned((data) => {
      const { message } = data;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? message : msg))
      );
      setPinnedMessages((prev) => [message, ...prev]);
    });

    // Message unpinned
    socketService.onMessageUnpinned((data) => {
      const { message } = data;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? message : msg))
      );
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== message.id));
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
      socketService.off('chat:message_pinned');
      socketService.off('chat:message_unpinned');
      socketService.off('chat:user_typing');
      socketService.off('chat:user_stop_typing');
    };
  }, [isAuthenticated, activeConversation, user]);

  const sendMessage = async (content: string, conversationId: string, replyToId?: string) => {
    try {
      const newMessage = await chatService.sendMessage(conversationId, {
        content,
        type: 'TEXT',
        replyToId,
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
      
      // Clear reply state after sending
      setReplyToMessage(null);
      
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
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };

  const pinMessage = async (messageId: string) => {
    try {
      const pinnedMsg = await chatService.pinMessage(messageId);
      // Update in messages list
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? pinnedMsg : msg))
      );
      // Add to pinned messages (if not already there via socket)
      setPinnedMessages((prev) => {
        if (prev.some((msg) => msg.id === messageId)) return prev;
        return [pinnedMsg, ...prev];
      });
    } catch (error) {
      console.error('Failed to pin message:', error);
      throw error;
    }
  };

  const unpinMessage = async (messageId: string) => {
    try {
      const unpinnedMsg = await chatService.unpinMessage(messageId);
      // Update in messages list
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? unpinnedMsg : msg))
      );
      // Remove from pinned messages
      setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to unpin message:', error);
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
        pinnedMessages,
        replyToMessage,
        isLoadingConversations,
        isLoadingMessages,
        typingUsers,
        setActiveConversation,
        setReplyToMessage,
        loadConversations,
        loadMessages,
        loadPinnedMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        pinMessage,
        unpinMessage,
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
