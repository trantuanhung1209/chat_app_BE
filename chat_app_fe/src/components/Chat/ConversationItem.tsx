import React from 'react';
import type { Conversation } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const { user: currentUser } = useAuth();

  // Get conversation display name
  const getDisplayName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Nhóm';
    }
    
    // For direct chat, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUser?.id
    );
    return otherParticipant?.user.fullName || 'Người dùng';
  };

  // Get avatar
  const getAvatar = () => {
    if (conversation.type === 'group') {
      return conversation.avatar || undefined;
    }
    
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUser?.id
    );
    return otherParticipant?.user.avatar || undefined;
  };

  // Format time
  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return messageDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Get last message from conversation
  const getLastMessage = () => {
    if (conversation.lastMessage) {
      return conversation.lastMessage;
    }
    // Fallback to messages array if lastMessage not available
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[conversation.messages.length - 1];
    }
    return null;
  };

  const lastMessage = getLastMessage();

  return (
    <div
      className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
        isActive ? 'bg-primary-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {getAvatar() ? (
            <img
              src={getAvatar() || ''}
              alt={getDisplayName()}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
              {getDisplayName().charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {getDisplayName()}
            </h3>
            {lastMessage && (
              <span className="text-xs text-gray-500 ml-2">
                {formatTime(lastMessage.createdAt)}
              </span>
            )}
          </div>

          {lastMessage ? (
            <p className="text-sm text-gray-600 truncate">
              {lastMessage.content}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Chưa có tin nhắn
            </p>
          )}
        </div>

        {/* Unread badge */}
        {conversation.unreadCount && conversation.unreadCount > 0 && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
