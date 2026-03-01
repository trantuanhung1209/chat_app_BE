import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import MessageItem from './MessageItem';

const MessageList: React.FC = () => {
  const { messages, pinnedMessages, activeConversation, isLoadingMessages, typingUsers } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">Chọn một cuộc trò chuyện để bắt đầu</p>
          <p className="text-gray-400 text-sm">Tin nhắn của bạn sẽ hiển thị ở đây</p>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const typingUsersInConversation = typingUsers.get(activeConversation.id) || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <button
            onClick={() => setShowPinnedMessages(!showPinnedMessages)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {pinnedMessages.length} tin nhắn đã ghim
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showPinnedMessages ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Pinned Messages List */}
          {showPinnedMessages && (
            <div className="border-t border-yellow-200 bg-white max-h-64 overflow-y-auto">
              <div className="p-4 space-y-3">
                {pinnedMessages.map((message) => (
                  <div key={message.id} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {message.sender.fullName}
                        </p>
                        <p className="text-sm text-gray-600 break-words">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(message.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showAvatar = 
                index === messages.length - 1 || 
                messages[index + 1]?.senderId !== message.senderId;
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                />
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        {typingUsersInConversation.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
            <span>{typingUsersInConversation.join(', ')} đang nhập...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
