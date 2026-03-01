import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFriend } from '../contexts/FriendContext';
import ConversationList from '../components/Chat/ConversationList';
import MessageList from '../components/Chat/MessageList';
import MessageInput from '../components/Chat/MessageInput';
import FriendsList from '../components/Friends/FriendsList';
import FriendRequests from '../components/Friends/FriendRequests';
import UserProfile from '../components/Friends/UserProfile';
import UserSearch from '../components/Friends/UserSearch';
import { useChat } from '../contexts/ChatContext';

type TabType = 'messages' | 'friends' | 'requests' | 'search' | 'profile';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { activeConversation } = useChat();
  const { incomingRequests } = useFriend();
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPasswordNotification, setShowPasswordNotification] = useState(false);

  useEffect(() => {
    const needSetPassword = searchParams.get('needSetPassword');
    if (needSetPassword === 'true' && !showPasswordNotification) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setShowPasswordNotification(true);
      }, 0);
      // Xóa query param sau khi đã hiển thị
      searchParams.delete('needSetPassword');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showPasswordNotification]);

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">💬 Chat App</h1>
        </div>

        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-semibold text-sm">
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium">{user?.fullName}</span>
        </div>
      </nav>

      {/* Google Login Notification */}
      {showPasswordNotification && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Đăng nhập Google thành công! 🎉
              </p>
              <p className="text-xs text-blue-700">
                Bạn có thể đặt mật khẩu để đăng nhập bằng email sau này.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordNotification(false)}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar with Tabs */}
        <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
          {/* Messages Tab */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'messages'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Tin nhắn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium">Chat</span>
          </button>

          {/* Friends Tab */}
          <button
            onClick={() => setActiveTab('friends')}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'friends'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Bạn bè"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs font-medium">Bạn</span>
          </button>

          {/* Requests Tab */}
          <button
            onClick={() => setActiveTab('requests')}
            className={`relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'requests'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Lời mời kết bạn"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="text-xs font-medium">Mời</span>
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>

          {/* Search Tab */}
          <button
            onClick={() => setActiveTab('search')}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'search'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Tìm kiếm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">Tìm</span>
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Tài khoản"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">Tôi</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          {/* Panel Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'messages' && 'Tin nhắn'}
              {activeTab === 'friends' && 'Bạn bè'}
              {activeTab === 'requests' && 'Lời mời kết bạn'}
              {activeTab === 'search' && 'Tìm kiếm người dùng'}
              {activeTab === 'profile' && 'Tài khoản'}
            </h2>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'messages' && <ConversationList />}
            {activeTab === 'friends' && <FriendsList />}
            {activeTab === 'requests' && <FriendRequests />}
            {activeTab === 'search' && <UserSearch />}
            {activeTab === 'profile' && <UserProfile />}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeTab === 'messages' && activeConversation ? (
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
          ) : activeTab === 'messages' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 text-lg mb-2">
                  Chọn một cuộc trò chuyện để bắt đầu
                </p>
                <p className="text-gray-400 text-sm">
                  Tin nhắn của bạn sẽ hiển thị ở đây
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {activeTab === 'friends' && '👥'}
                  {activeTab === 'requests' && '✉️'}
                  {activeTab === 'search' && '🔍'}
                  {activeTab === 'profile' && '👤'}
                </div>
                <p className="text-gray-500 text-lg">
                  {activeTab === 'friends' && 'Quản lý danh sách bạn bè'}
                  {activeTab === 'requests' && 'Xem lời mời kết bạn'}
                  {activeTab === 'search' && 'Tìm kiếm và kết bạn mới'}
                  {activeTab === 'profile' && 'Thông tin cá nhân'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
