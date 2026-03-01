import React, { useState } from 'react';
import { useFriend } from '../../contexts/FriendContext';
import { chatService } from '../../services/chat.service';
import { useChat } from '../../contexts/ChatContext';
import type { Friend } from '../../types';

const FriendsList: React.FC = () => {
  const { friends, isLoadingFriends, removeFriend } = useFriend();
  const { setActiveConversation } = useChat();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bạn bè này?')) return;
    
    setRemovingId(friendId);
    try {
      await removeFriend(friendId);
    } catch {
      alert('Không thể xóa bạn bè');
    } finally {
      setRemovingId(null);
    }
  };

  const handleStartChat = async (friend: Friend) => {
    try {
      // Create or get direct conversation with friend
      const conversation = await chatService.createConversation({
        isGroup: false,
        participantIds: [friend.friendId],
      });
      setActiveConversation(conversation);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  if (isLoadingFriends) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có bạn bè</h3>
        <p className="mt-1 text-sm text-gray-500">Hãy thêm bạn bè để bắt đầu trò chuyện!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {friends.map((friend) => (
        <div key={friend.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Avatar */}
              {friend.friend.avatar ? (
                <img
                  src={friend.friend.avatar}
                  alt={friend.friend.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {friend.friend.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {friend.friend.fullName}
                </h3>
                <p className="text-xs text-gray-500 truncate">{friend.friend.email}</p>
                {friend.friend.isOnline && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Đang online
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartChat(friend)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Nhắn tin"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              
              <button
                onClick={() => handleRemoveFriend(friend.id)}
                disabled={removingId === friend.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Xóa bạn bè"
              >
                {removingId === friend.id ? (
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendsList;
