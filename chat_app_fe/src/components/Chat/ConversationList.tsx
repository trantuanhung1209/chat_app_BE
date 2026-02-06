import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ConversationItem from './ConversationItem';

const ConversationList: React.FC = () => {
  const { conversations, activeConversation, setActiveConversation, isLoadingConversations } = useChat();

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Tin nhắn</h2>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {!conversations || conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversation?.id === conversation.id}
                onClick={() => setActiveConversation(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
