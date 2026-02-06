import React, { useEffect, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import MessageItem from './MessageItem';

const MessageList: React.FC = () => {
  const { messages, activeConversation, isLoadingMessages, typingUsers } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
  );
};

export default MessageList;
