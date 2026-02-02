import * as api from './api.js';
import { showToast, getAvatar, getColorForUser } from './utils.js';
import { reloadFriends, reloadRequests } from './auth.js';

// Send Friend Request
export async function sendFriendRequest(userId) {
    try {
        const data = await api.sendFriendRequest(userId);
        
        if (data.success || data.message) {
            showToast('Đã gửi lời mời kết bạn', 'success');
            reloadRequests();
        } else {
            showToast(data.message || 'Không thể gửi lời mời', 'error');
        }
    } catch (error) {
        console.error('Send friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Accept Friend Request
export async function acceptFriendRequest(requestId) {
    console.log('friends.js acceptFriendRequest - requestId:', requestId);
    try {
        const data = await api.acceptFriendRequest(requestId);
        
        if (data.success || data.message) {
            showToast('Đã chấp nhận lời mời kết bạn', 'success');
            reloadFriends();
            reloadRequests();
        } else {
            showToast(data.message || 'Không thể chấp nhận lời mời', 'error');
        }
    } catch (error) {
        console.error('Accept friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Reject Friend Request
export async function rejectFriendRequest(requestId) {
    try {
        const data = await api.rejectFriendRequest(requestId);
        
        if (data.success || data.message) {
            showToast('Đã từ chối lời mời', 'success');
            reloadRequests();
        } else {
            showToast(data.message || 'Không thể từ chối lời mời', 'error');
        }
    } catch (error) {
        console.error('Reject friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Cancel Friend Request
export async function cancelFriendRequest(requestId) {
    try {
        const data = await api.cancelFriendRequest(requestId);
        
        if (data.success || data.message) {
            showToast('Đã hủy lời mời', 'success');
            reloadRequests();
        } else {
            showToast(data.message || 'Không thể hủy lời mời', 'error');
        }
    } catch (error) {
        console.error('Cancel friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Remove Friend
export async function removeFriend(userId) {
    if (!confirm('Bạn có chắc muốn xóa bạn bè này?')) {
        return;
    }
    
    try {
        const data = await api.removeFriend(userId);
        
        if (data.success || data.message) {
            showToast('Đã xóa bạn bè', 'success');
            reloadFriends();
        } else {
            showToast(data.message || 'Không thể xóa bạn bè', 'error');
        }
    } catch (error) {
        console.error('Remove friend error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Display Friends
export function displayFriends(friendsList) {
    const container = document.getElementById('friendsList');
    
    if (!friendsList || friendsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3>Chưa có bạn bè</h3>
                <p>Hãy thêm bạn bè để bắt đầu trò chuyện!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = friendsList.map(friend => {
        const username = friend.fullName || friend.username;
        const color = getColorForUser(friend.id);
        
        let avatarHTML;
        if (friend.avatar) {
            avatarHTML = `<img src="${friend.avatar}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const avatar = getAvatar(username);
            avatarHTML = avatar;
        }
        
        return `
            <div class="friend-card">
                <div class="friend-card-header">
                    <div class="user-avatar" style="background: ${friend.avatar ? 'transparent' : color}">${avatarHTML}</div>
                    <div class="friend-info">
                        <h4>${username}</h4>
                        <span>${friend.email}</span>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-small btn-primary" onclick="window.openChat('${friend.id}', '${username}', '${friend.avatar || ''}')">
                        Chat
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.removeFriend('${friend.id}')">
                        Xóa
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Display Incoming Requests
export function displayIncomingRequests(requests) {
    const container = document.getElementById('incoming-requests');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>Không có lời mời nào</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => {
        const sender = request.sender || request;
        const requestId = request.requestId || request.id; // Lấy requestId
        console.log('displayIncomingRequests - request:', request, 'requestId:', requestId);
        const username = sender.fullName || sender.username;
        const color = getColorForUser(sender.id);
        
        let avatarHTML;
        if (sender.avatar) {
            avatarHTML = `<img src="${sender.avatar}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const avatar = getAvatar(username);
            avatarHTML = avatar;
        }
        
        return `
            <div class="request-card">
                <div class="request-user">
                    <div class="user-avatar" style="background: ${sender.avatar ? 'transparent' : color}">${avatarHTML}</div>
                    <div>
                        <h4>${username}</h4>
                        <span>${sender.email}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-small btn-success" onclick="window.acceptFriendRequest('${requestId}')">
                        Chấp nhận
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.rejectFriendRequest('${requestId}')">
                        Từ chối
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Display Outgoing Requests
export function displayOutgoingRequests(response) {
    const container = document.getElementById('outgoing-requests');
    const requests = response.data || response;
    const metadata = response.metadata || {};
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>Chưa gửi lời mời nào</h3>
            </div>
        `;
        return;
    }
    
    const requestsHTML = requests.map(request => {
        const receiver = request.receiver || request;
        const requestId = request.requestId || request.id; // Lấy requestId
        const username = receiver.fullName || receiver.username;
        const color = getColorForUser(receiver.id);
        
        let avatarHTML;
        if (receiver.avatar) {
            avatarHTML = `<img src="${receiver.avatar}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const avatar = getAvatar(username);
            avatarHTML = avatar;
        }
        
        return `
            <div class="request-card">
                <div class="request-user">
                    <div class="user-avatar" style="background: ${receiver.avatar ? 'transparent' : color}">${avatarHTML}</div>
                    <div>
                        <h4>${username}</h4>
                        <span>${receiver.email}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.cancelFriendRequest('${requestId}')">
                        Hủy lời mời
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Pagination
    const totalPages = metadata.totalPages || 1;
    const currentPageNum = metadata.page || 1;
    const total = metadata.total || requests.length;
    
    let paginationHTML = '';
    if (totalPages > 1) {
        paginationHTML = `
            <div class="pagination">
                <button class="btn btn-small" ${currentPageNum === 1 ? 'disabled' : ''} onclick="window.loadOutgoingRequestsPage(${currentPageNum - 1})">
                    ← Trước
                </button>
                <span class="page-info">Trang ${currentPageNum} / ${totalPages} (Tổng: ${total})</span>
                <button class="btn btn-small" ${currentPageNum === totalPages ? 'disabled' : ''} onclick="window.loadOutgoingRequestsPage(${currentPageNum + 1})">
                    Sau →
                </button>
            </div>
        `;
    }
    
    container.innerHTML = requestsHTML + paginationHTML;
}

// Filter Friends
export function filterFriends(query, allFriends) {
    const filtered = allFriends.filter(friend => 
        (friend.fullName || friend.username).toLowerCase().includes(query.toLowerCase()) ||
        friend.email.toLowerCase().includes(query.toLowerCase())
    );
    displayFriends(filtered);
}

// Update Request Badge
export function updateRequestBadge(incomingCount, outgoingCount) {
    document.getElementById('incomingBadge').textContent = incomingCount;
    document.getElementById('outgoingBadge').textContent = outgoingCount;
}
