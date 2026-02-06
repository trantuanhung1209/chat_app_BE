import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFriend } from '../../contexts/FriendContext';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { friends, incomingRequests } = useFriend();

  const handleLogout = async () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 border-4 border-white shadow-lg">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.fullName}</h2>
        <p className="text-gray-600 mb-4">{user.email}</p>
        
        {user.isOnline && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Đang online
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">{friends.length}</div>
          <div className="text-sm text-gray-600">Bạn bè</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">{incomingRequests.length}</div>
          <div className="text-sm text-gray-600">Lời mời</div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin tài khoản</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900">{user.email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vai trò</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{user.role || 'User'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ID</span>
              <span className="text-xs font-mono text-gray-500">{user.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
