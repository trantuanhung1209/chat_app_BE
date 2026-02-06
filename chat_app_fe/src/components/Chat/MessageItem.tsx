import React from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, showAvatar }) => {
  const { user: currentUser } = useAuth();
  const isOwnMessage = message.senderId === currentUser?.id;

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8">
        {showAvatar && !isOwnMessage && (
          message.sender.avatar ? (
            <img
              src={message.sender.avatar}
              alt={message.sender.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">
              {message.sender.fullName.charAt(0).toUpperCase()}
            </div>
          )
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && showAvatar && (
          <span className="text-xs text-gray-600 mb-1 px-3">
            {message.sender.fullName}
          </span>
        )}

        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
          }`}
        >
          <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
          {message.isEdited && (
            <span className="text-xs text-gray-400 italic">Đã chỉnh sửa</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
