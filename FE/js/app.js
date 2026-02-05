// Configuration
const API_URL = 'http://localhost:3000'; // Thay đổi theo URL backend của bạn

// State
let currentUser = null;
let accessToken = null;
let refreshToken = null;
let friends = [];
let incomingRequests = [];
let outgoingRequests = [];
let currentChatUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    handleOAuthRedirect();
    checkAuth();
    initializeEventListeners();
});

// Handle OAuth Redirect
function handleOAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlAccessToken = urlParams.get('accessToken');
    const urlRefreshToken = urlParams.get('refreshToken');
    
    if (urlAccessToken && urlRefreshToken) {
        localStorage.setItem('accessToken', urlAccessToken);
        localStorage.setItem('refreshToken', urlRefreshToken);
        
        // Remove tokens from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check Authentication
function checkAuth() {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken) {
        fetchCurrentUser();
    } else {
        showPage('auth-page');
    }
}

// Event Listeners
function initializeEventListeners() {
    // Auth tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Google login
    document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleLogin);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Requests tabs
    document.querySelectorAll('.requests-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchRequestsTab(tab);
        });
    });
    
    // Search user
    document.getElementById('searchUserBtn').addEventListener('click', searchUsers);
    document.getElementById('userSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
    
    // Friend search
    document.getElementById('friendSearch').addEventListener('input', (e) => {
        filterFriends(e.target.value);
    });
    
    // Chat
    document.getElementById('closeChatBtn').addEventListener('click', closeChat);
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Set Password Form
    document.getElementById('setPasswordForm')?.addEventListener('submit', handleSetPassword);
}

// Auth Functions
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            accessToken = data.accessToken;
            refreshToken = data.refreshToken;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            await fetchCurrentUser();
            showToast('Đăng nhập thành công!', 'success');
            showPage('app-page');
            loadFriends();
        } else {
            showToast(data.message || 'Đăng nhập thất bại', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Có lỗi xảy ra khi đăng nhập', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        showToast('Mật khẩu không khớp', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Đăng ký thành công! Vui lòng đăng nhập', 'success');
            switchAuthTab('login');
            document.getElementById('registerForm').reset();
        } else {
            showToast(data.message || 'Đăng ký thất bại', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('Có lỗi xảy ra khi đăng ký', 'error');
    }
}

function handleGoogleLogin() {
    window.location.href = `${API_URL}/auth/google`;
}

async function handleLogout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    
    showToast('Đã đăng xuất', 'success');
    showPage('auth-page');
}

// API Functions
async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user || data.data || data;
            // Thêm alias username từ fullName để tương thích với code cũ
            if (currentUser.fullName && !currentUser.username) {
                currentUser.username = currentUser.fullName;
            }
            updateUserInfo();
            showPage('app-page');
            loadFriends();
            loadRequests();
        } else if (response.status === 401) {
            // Token expired, try refresh
            await refreshAccessToken();
        } else {
            throw new Error('Failed to fetch user');
        }
    } catch (error) {
        console.error('Fetch user error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        showPage('auth-page');
    }
}

async function refreshAccessToken() {
    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });
        
        if (response.ok) {
            const data = await response.json();
            accessToken = data.accessToken;
            localStorage.setItem('accessToken', accessToken);
            await fetchCurrentUser();
        } else {
            throw new Error('Refresh failed');
        }
    } catch (error) {
        console.error('Refresh token error:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        showPage('auth-page');
    }
}

async function loadFriends() {
    try {
        const response = await fetch(`${API_URL}/friends`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            friends = data.friends || data;
            displayFriends(friends);
        }
    } catch (error) {
        console.error('Load friends error:', error);
        showToast('Không thể tải danh sách bạn bè', 'error');
    }
}

async function loadRequests() {
    try {
        const [incomingResponse, outgoingResponse] = await Promise.all([
            fetch(`${API_URL}/friends/requests/incoming`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            }),
            fetch(`${API_URL}/friends/requests/outgoing`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            }),
        ]);
        
        if (incomingResponse.ok) {
            const data = await incomingResponse.json();
            incomingRequests = data.requests || data;
            displayIncomingRequests(incomingRequests);
            updateRequestBadge();
        }
        
        if (outgoingResponse.ok) {
            const data = await outgoingResponse.json();
            outgoingRequests = data.requests || data;
            displayOutgoingRequests(outgoingRequests);
        }
    } catch (error) {
        console.error('Load requests error:', error);
    }
}

async function sendFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/friends/request`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ receiverId: userId }),
        });
        
        if (response.ok) {
            showToast('Đã gửi lời mời kết bạn', 'success');
            loadRequests();
        } else {
            const data = await response.json();
            showToast(data.message || 'Không thể gửi lời mời', 'error');
        }
    } catch (error) {
        console.error('Send friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

async function acceptFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/friends/accept`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ senderId: userId }),
        });
        
        if (response.ok) {
            showToast('Đã chấp nhận lời mời kết bạn', 'success');
            loadFriends();
            loadRequests();
        } else {
            const data = await response.json();
            showToast(data.message || 'Không thể chấp nhận lời mời', 'error');
        }
    } catch (error) {
        console.error('Accept friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

async function rejectFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/friends/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ senderId: userId }),
        });
        
        if (response.ok) {
            showToast('Đã từ chối lời mời', 'success');
            loadRequests();
        } else {
            const data = await response.json();
            showToast(data.message || 'Không thể từ chối lời mời', 'error');
        }
    } catch (error) {
        console.error('Reject friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

async function cancelFriendRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/friends/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ receiverId: userId }),
        });
        
        if (response.ok) {
            showToast('Đã hủy lời mời', 'success');
            loadRequests();
        } else {
            const data = await response.json();
            showToast(data.message || 'Không thể hủy lời mời', 'error');
        }
    } catch (error) {
        console.error('Cancel friend request error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

async function removeFriend(userId) {
    if (!confirm('Bạn có chắc muốn xóa bạn bè này?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/friends/unfriend`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ friendId: userId }),
        });
        
        if (response.ok) {
            showToast('Đã xóa bạn bè', 'success');
            loadFriends();
        } else {
            const data = await response.json();
            showToast(data.message || 'Không thể xóa bạn bè', 'error');
        }
    } catch (error) {
        console.error('Remove friend error:', error);
        showToast('Có lỗi xảy ra', 'error');
    }
}

async function searchUsers() {
    const query = document.getElementById('userSearch').value.trim();
    
    if (!query) {
        showToast('Vui lòng nhập từ khóa tìm kiếm', 'warning');
        return;
    }
    
    // Note: Backend cần implement API search users
    showToast('Tính năng tìm kiếm đang được phát triển', 'warning');
    
    // Placeholder for search results
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3>Tính năng đang phát triển</h3>
            <p>API tìm kiếm người dùng chưa được implement ở backend</p>
        </div>
    `;
}

// UI Functions
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function switchView(viewName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Load data for specific views
    if (viewName === 'friends') {
        loadFriends();
    } else if (viewName === 'requests') {
        loadRequests();
    } else if (viewName === 'profile') {
        displayProfile();
    }
}

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

function updateUserInfo() {
    if (!currentUser) return;
    
    const avatar = getAvatar(currentUser.username);
    document.getElementById('currentUserAvatar').textContent = avatar;
    document.getElementById('currentUserAvatar').style.background = getColorForUser(currentUser.id);
    document.getElementById('currentUsername').textContent = currentUser.username;
}

function displayFriends(friendsList) {
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
        const avatar = getAvatar(friend.username);
        const color = getColorForUser(friend.id);
        
        return `
            <div class="friend-card">
                <div class="friend-card-header">
                    <div class="user-avatar" style="background: ${color}">${avatar}</div>
                    <div class="friend-info">
                        <h4>${friend.username}</h4>
                        <span>${friend.email}</span>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-small btn-primary" onclick="openChat('${friend.id}', '${friend.username}')">
                        Chat
                    </button>
                    <button class="btn btn-small btn-danger" onclick="removeFriend('${friend.id}')">
                        Xóa
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayIncomingRequests(requests) {
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
        const avatar = getAvatar(sender.username);
        const color = getColorForUser(sender.id);
        
        return `
            <div class="request-card">
                <div class="request-user">
                    <div class="user-avatar" style="background: ${color}">${avatar}</div>
                    <div>
                        <h4>${sender.username}</h4>
                        <span>${sender.email}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-small btn-success" onclick="acceptFriendRequest('${sender.id}')">
                        Chấp nhận
                    </button>
                    <button class="btn btn-small btn-danger" onclick="rejectFriendRequest('${sender.id}')">
                        Từ chối
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayOutgoingRequests(requests) {
    const container = document.getElementById('outgoing-requests');
    
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>Chưa gửi lời mời nào</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => {
        const receiver = request.receiver || request;
        const avatar = getAvatar(receiver.username);
        const color = getColorForUser(receiver.id);
        
        return `
            <div class="request-card">
                <div class="request-user">
                    <div class="user-avatar" style="background: ${color}">${avatar}</div>
                    <div>
                        <h4>${receiver.username}</h4>
                        <span>${receiver.email}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-small btn-secondary" onclick="cancelFriendRequest('${receiver.id}')">
                        Hủy lời mời
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayProfile() {
    if (!currentUser) return;
    
    const avatar = getAvatar(currentUser.username);
    const color = getColorForUser(currentUser.id);
    
    document.getElementById('profileAvatar').textContent = avatar;
    document.getElementById('profileAvatar').style.background = color;
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = currentUser.role || 'User';
    document.getElementById('profileCreatedAt').textContent = new Date(currentUser.createdAt).toLocaleDateString('vi-VN');
    
    // Kiểm tra nếu user login bằng Google và chưa có password
    const passwordWarning = document.getElementById('passwordWarning');
    if (currentUser.typeAuth === 'GOOGLE' && !currentUser.hasPassword) {
        passwordWarning.style.display = 'flex';
    } else {
        passwordWarning.style.display = 'none';
    }
}

function filterFriends(query) {
    const filtered = friends.filter(friend => 
        friend.username.toLowerCase().includes(query.toLowerCase()) ||
        friend.email.toLowerCase().includes(query.toLowerCase())
    );
    displayFriends(filtered);
}

function updateRequestBadge() {
    const count = incomingRequests.length;
    document.getElementById('requestBadge').textContent = count;
    document.getElementById('incomingBadge').textContent = count;
    document.getElementById('outgoingBadge').textContent = outgoingRequests.length;
}

// Chat Functions
function openChat(userId, username) {
    currentChatUser = { id: userId, username };
    
    const avatar = getAvatar(username);
    const color = getColorForUser(userId);
    
    document.getElementById('chatUserAvatar').textContent = avatar;
    document.getElementById('chatUserAvatar').style.background = color;
    document.getElementById('chatUsername').textContent = username;
    document.getElementById('chatPanel').classList.add('active');
    
    loadChatMessages(userId);
}

function closeChat() {
    document.getElementById('chatPanel').classList.remove('active');
    currentChatUser = null;
}

function loadChatMessages(userId) {
    // Placeholder - Backend cần implement chat API
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <h3>Bắt đầu trò chuyện</h3>
            <p>Tính năng chat đang được phát triển</p>
        </div>
    `;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !currentChatUser) return;
    
    // Placeholder - Backend cần implement chat API
    showToast('Tính năng chat đang được phát triển', 'warning');
    input.value = '';
}

// Set Password Handler
async function handleSetPassword(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu không khớp!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return;
    }
    
    try {
        // Gọi API register để set password (backend sẽ update user nếu đã tồn tại)
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                fullName: currentUser.username,
                email: currentUser.email,
                password: newPassword,
                avatar: currentUser.avatar
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Đặt mật khẩu thành công!', 'success');
            // Cập nhật lại thông tin user
            await fetchCurrentUser();
            // Form sẽ tự động ẩn vì displayProfile() được gọi lại
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Password setup error:', error);
        showToast('Có lỗi xảy ra khi đặt mật khẩu', 'error');
    }
}

// Utility Functions
function getAvatar(username) {
    return username ? username.charAt(0).toUpperCase() : '?';
}

function getColorForUser(userId) {
    const colors = [
        '#5865F2', '#3ba55d', '#ed4245', '#faa61a', 
        '#5865F2', '#eb459e', '#00b0f4', '#f26522'
    ];
    const hash = userId ? userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return colors[hash % colors.length];
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Export functions for onclick handlers
window.acceptFriendRequest = acceptFriendRequest;
window.rejectFriendRequest = rejectFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.removeFriend = removeFriend;
window.openChat = openChat;
window.sendFriendRequest = sendFriendRequest;
