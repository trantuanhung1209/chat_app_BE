import React, { useState, useEffect } from 'react';
import { useFriend } from '../../contexts/FriendContext';

type TabType = 'incoming' | 'outgoing';

const FriendRequests: React.FC = () => {
  const { 
    incomingRequests, 
    outgoingRequests, 
    isLoadingIncoming, 
    isLoadingOutgoing,
    loadIncomingRequests,
    loadOutgoingRequests,
    acceptFriendRequest, 
    rejectFriendRequest 
  } = useFriend();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('incoming');

  // Load data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'incoming') {
      loadIncomingRequests();
    } else {
      loadOutgoingRequests();
    }
  }, [activeTab, loadIncomingRequests, loadOutgoingRequests]);

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await acceptFriendRequest(requestId);
    } catch {
      alert('Không thể chấp nhận lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await rejectFriendRequest(requestId);
    } catch {
      alert('Không thể từ chối lời mời');
    } finally {
      setProcessingId(null);
    }
  };

  const isLoading = activeTab === 'incoming' ? isLoadingIncoming : isLoadingOutgoing;
  const requests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'incoming'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lời mời nhận được
          {incomingRequests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
              {incomingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'outgoing'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lời mời đã gửi
          {outgoingRequests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              {outgoingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeTab === 'incoming' ? 'Không có lời mời nào' : 'Chưa gửi lời mời nào'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'incoming' 
                ? 'Bạn chưa nhận được lời mời kết bạn nào' 
                : 'Bạn chưa gửi lời mời kết bạn nào'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => {
              const user = activeTab === 'incoming' ? request.sender : request.receiver;
              
              return (
                <div 
                  key={request.id} 
                  className={`p-4 transition-colors ${
                    activeTab === 'incoming' ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Avatar */}
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {user.fullName}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activeTab === 'incoming' ? 'Đã gửi lời mời kết bạn' : 'Đang chờ phản hồi'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {activeTab === 'incoming' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={processingId === request.id}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === request.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Chấp nhận'
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    {activeTab === 'outgoing' && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                          Đang chờ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
