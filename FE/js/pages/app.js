// App Page
import * as api from '../api.js';
import { showToast, getAvatar, getColorForUser, formatDate } from '../utils.js';
import { displayFriends, displayIncomingRequests, displayOutgoingRequests, filterFriends, updateRequestBadge, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend } from '../friends.js';
import { openChat, closeChat, sendMessage } from '../chat.js';
import { searchUsers } from '../search.js';

let currentUser = null;
let friends = [];
let incomingRequests = [];
let outgoingRequests = [];
let currentOutgoingPage = 1;
const outgoingPageSize = 10;

// Check Authentication - Verify session với /auth/me (sử dụng httpOnly cookies)
checkAuth();

async function checkAuth() {
    // Verify session với server thông qua /auth/me
    // Cookie sẽ tự động được gửi kèm request
    try {
        const data = await api.getCurrentUser();
        currentUser = data.user || data.data || data;
        
        // Session hợp lệ, tiếp tục khởi tạo app
        initApp();
    } catch (error) {
        console.error('Auth check failed:', error);
        
        // Session không hợp lệ, thử refresh token
        try {
            const refreshData = await api.refreshAccessToken();
            if (refreshData.success) {
                // Cookies đã được cập nhật từ server, retry checkAuth
                await checkAuth();
            } else {
                throw new Error('Refresh failed');
            }
        } catch (refreshError) {
            console.error('Refresh token failed:', refreshError);
            // Refresh thất bại, redirect về login
            window.location.href = 'login.html';
        }
    }
}

function initApp() {
    // CurrentUser đã được set từ checkAuth
    updateUserInfo();
    loadFriends();
    loadRequests();
}

// Update User Info
function updateUserInfo() {
    if (!currentUser) return;
    
    const avatarElement = document.getElementById('currentUserAvatar');
    const username = currentUser.fullName || currentUser.username;
    
    if (currentUser.avatar) {
        avatarElement.innerHTML = `<img src="${currentUser.avatar}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
        const avatar = getAvatar(username);
        const color = getColorForUser(currentUser.id);
        avatarElement.textContent = avatar;
        avatarElement.style.background = color;
    }
    
    document.getElementById('currentUsername').textContent = username;
}

// Load Friends
async function loadFriends() {
    try {
        const data = await api.getFriends();
        friends = data.friends || data.data || data;
        displayFriends(friends);
    } catch (error) {
        console.error('Load friends error:', error);
        showToast('Không thể tải danh sách bạn bè', 'error');
    }
}

// Load Requests
async function loadRequests() {
    try {
        const [incomingData, outgoingData] = await Promise.all([
            api.getIncomingRequests(),
            api.getOutgoingRequests(currentOutgoingPage, outgoingPageSize),
        ]);
        
        incomingRequests = incomingData.requests || incomingData.data || incomingData;
        const outgoingTotal = outgoingData.metadata?.total || (outgoingData.data || outgoingData).length;
        
        displayIncomingRequests(incomingRequests);
        displayOutgoingRequests(outgoingData);
        updateRequestBadge(incomingRequests.length, outgoingTotal);
    } catch (error) {
        console.error('Load requests error:', error);
    }
}

// Load Outgoing Requests by Page
async function loadOutgoingRequestsPage(page) {
    currentOutgoingPage = page;
    try {
        const outgoingData = await api.getOutgoingRequests(page, outgoingPageSize);
        displayOutgoingRequests(outgoingData);
        
        const outgoingTotal = outgoingData.metadata?.total || (outgoingData.data || outgoingData).length;
        const incomingCount = incomingRequests.length;
        updateRequestBadge(incomingCount, outgoingTotal);
    } catch (error) {
        console.error('Load outgoing requests error:', error);
        showToast('Không thể tải danh sách lời mời', 'error');
    }
}

// Display Profile
function displayProfile() {
    if (!currentUser) return;
    
    const username = currentUser.fullName || currentUser.username;
    const avatarElement = document.getElementById('profileAvatar');
    
    if (currentUser.avatar) {
        avatarElement.innerHTML = `<img src="${currentUser.avatar}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
        const avatar = getAvatar(username);
        const color = getColorForUser(currentUser.id);
        avatarElement.textContent = avatar;
        avatarElement.style.background = color;
    }
    
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = currentUser.role || 'User';
    document.getElementById('profileCreatedAt').textContent = formatDate(currentUser.createdAt);
}

// Switch View
function switchView(viewName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    if (viewName === 'profile') {
        displayProfile();
    } else if (viewName === 'incoming-requests' || viewName === 'outgoing-requests') {
        // Reload requests khi mở view
        loadRequests();
    }
}

// Switch Requests Tab (deprecated - không còn dùng do đã tách riêng view)
function switchRequestsTab(tab) {
    document.querySelectorAll('.requests-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.requests-list').forEach(list => {
        list.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-requests`).classList.add('active');
}

// Logout
async function handleLogout() {
    try {
        await api.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    api.clearTokens();
    showToast('Đã đăng xuất', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

// Event Listeners
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        switchView(view);
    });
});

document.getElementById('logoutBtn').addEventListener('click', handleLogout);

document.querySelectorAll('.requests-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        switchRequestsTab(tab);
    });
});

document.getElementById('searchUserBtn').addEventListener('click', searchUsers);
document.getElementById('userSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchUsers();
    }
});

document.getElementById('friendSearch').addEventListener('input', (e) => {
    filterFriends(e.target.value, friends);
});

document.getElementById('closeChatBtn').addEventListener('click', closeChat);
document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Export functions to window for onclick handlers
window.acceptFriendRequest = (requestId) => {
    acceptFriendRequest(requestId);
    setTimeout(() => {
        loadFriends();
        loadRequests();
    }, 500);
};

window.rejectFriendRequest = (requestId) => {
    rejectFriendRequest(requestId);
    setTimeout(loadRequests, 500);
};

window.cancelFriendRequest = (requestId) => {
    cancelFriendRequest(requestId);
    setTimeout(loadRequests, 500);
};

window.removeFriend = (userId) => {
    removeFriend(userId);
    setTimeout(loadFriends, 500);
};

window.openChat = openChat;
window.sendFriendRequest = sendFriendRequest;
window.loadOutgoingRequestsPage = loadOutgoingRequestsPage;
