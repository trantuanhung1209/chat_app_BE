import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, showAvatar }) => {
  const { user: currentUser } = useAuth();
  const { setReplyToMessage, pinMessage, unpinMessage, deleteMessage } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwnMessage = message.senderId === currentUser?.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReply = () => {
    setReplyToMessage(message);
    setShowMenu(false);
  };

  const handlePin = async () => {
    try {
      if (message.isPinned) {
        await unpinMessage(message.id);
      } else {
        await pinMessage(message.id);
      }
    } catch (error) {
      console.error('Failed to pin/unpin message:', error);
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
      try {
        await deleteMessage(message.id);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
    setShowMenu(false);
  };

  return (
    <div className={`flex gap-2 group relative ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
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

        <div className="relative">
          {/* Pin indicator */}
          {message.isPinned && (
            <div className="absolute -top-2 -left-2 bg-yellow-400 rounded-full p-1 z-10">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
            </div>
          )}

          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
            }`}
          >
            {/* Reply Preview */}
            {message.replyTo && (
              <div className={`mb-2 pb-2 border-l-2 pl-2 ${
                isOwnMessage ? 'border-blue-400' : 'border-gray-400'
              }`}>
                <p className={`text-xs font-medium ${isOwnMessage ? 'text-blue-200' : 'text-gray-600'}`}>
                  {message.replyTo.sender.fullName}
                </p>
                <p className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} truncate`}>
                  {message.replyTo.content}
                </p>
              </div>
            )}

            <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Context Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute top-0 ${isOwnMessage ? 'left-0 -ml-8' : 'right-0 -mr-8'} 
              opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full`}
          >
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Context Menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className={`absolute top-0 ${isOwnMessage ? 'left-0 -ml-48' : 'right-0 -mr-48'} 
                w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20`}
            >
              <button
                onClick={handleReply}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Phản hồi
              </button>

              <button
                onClick={handlePin}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                </svg>
                {message.isPinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
              </button>

              {isOwnMessage && (
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa tin nhắn
                </button>
              )}
            </div>
          )}
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
