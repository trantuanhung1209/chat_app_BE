import React, { useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatLayout: React.FC = () => {
  const { activeConversation, loadMessages, markConversationAsRead } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      markConversationAsRead(activeConversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  // Get conversation display name for header
  const getDisplayName = () => {
    if (!activeConversation) return '';
    
    if (activeConversation.type === 'group') {
      return activeConversation.name || 'Nhóm';
    }
    
    const otherParticipant = activeConversation.participants.find(
      (p) => p.userId !== user?.id
    );
    return otherParticipant?.user.fullName || 'Người dùng';
  };

  return (
    <div className="flex h-screen">
      {/* Conversation List - Left Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationList />
      </div>

      {/* Chat Area - Right Side */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {getDisplayName()}
                </h2>
                <span className="text-sm text-gray-500">
                  {activeConversation.participants.length} thành viên
                </span>
              </div>
            </div>

            {/* Messages */}
            <MessageList />

            {/* Message Input */}
            <MessageInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">
                Chọn một cuộc trò chuyện để bắt đầu
              </p>
              <p className="text-gray-400 text-sm">
                Tin nhắn của bạn sẽ hiển thị ở đây
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
