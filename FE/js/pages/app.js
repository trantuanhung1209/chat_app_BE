// App Page
import * as api from '../api.js';
import { showToast, getAvatar, getColorForUser, formatDate } from '../utils.js';
import { displayFriends, displayIncomingRequests, displayOutgoingRequests, filterFriends, updateRequestBadge, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend } from '../friends.js';
import { openChat, closeChat, sendMessage } from '../chat.js';
import { searchUsers } from '../search.js';
import { validateFormData } from '../validation.js';
import { initSocket, disconnectSocket } from '../socket.js';

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
        // Nếu lỗi, redirect về login (apiRequest đã xử lý refresh token)
        window.location.href = 'login.html';
    }
}

function initApp() {
    // CurrentUser đã được set từ checkAuth
    updateUserInfo();
    loadFriends();
    loadRequests();
    
    // Khởi tạo socket connection
    initSocket();
    
    // Setup socket event listeners
    setupSocketEventListeners();
}

// Setup socket event listeners
function setupSocketEventListeners() {
    // Friend request received - Reload requests khi có lời mời mới
    window.addEventListener('socketNewFriendRequest', (e) => {
        console.log('🔔 Socket event: New friend request', e.detail);
        loadRequests();
    });
    
    // Friend request accepted - Reload friends và requests
    window.addEventListener('socketFriendRequestAccepted', (e) => {
        console.log('🔔 Socket event: Friend request accepted', e.detail);
        loadFriends();
        loadRequests();
    });
    
    // Friend request rejected
    window.addEventListener('socketFriendRequestRejected', (e) => {
        console.log('🔔 Socket event: Friend request rejected', e.detail);
        loadRequests();
    });
    
    // Friend request cancelled - Reload requests
    window.addEventListener('socketFriendRequestCancelled', (e) => {
        console.log('🔔 Socket event: Friend request cancelled', e.detail);
        loadRequests();
    });
    
    // Friend removed - Reload friends
    window.addEventListener('socketFriendRemoved', (e) => {
        console.log('🔔 Socket event: Friend removed', e.detail);
        loadFriends();
    });
    
    // Friend blocked
    window.addEventListener('socketFriendBlocked', (e) => {
        console.log('🔔 Socket event: Friend blocked', e.detail);
        loadFriends();
    });
    
    // User online/offline status
    window.addEventListener('socketUserOnline', (e) => {
        console.log('🔔 Socket event: User online', e.detail);
        updateUserOnlineStatus(e.detail.userId, true);
    });
    
    window.addEventListener('socketUserOffline', (e) => {
        console.log('🔔 Socket event: User offline', e.detail);
        updateUserOnlineStatus(e.detail.userId, false);
    });
}

// Update user online status in UI
function updateUserOnlineStatus(userId, isOnline) {
    // Update status indicator for this user in friends list and chat
    const statusElements = document.querySelectorAll(`[data-user-id="${userId}"] .status`);
    statusElements.forEach(el => {
        el.textContent = isOnline ? 'Online' : 'Offline';
        el.classList.toggle('online', isOnline);
        el.classList.toggle('offline', !isOnline);
    });
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
    
    console.log('Display Profile - currentUser:', currentUser); // Debug log
    
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
    
    // Kiểm tra nếu user login bằng Google và chưa có password
    const passwordWarning = document.getElementById('passwordWarning');
    if (passwordWarning) {
        if (currentUser.typeAuth === 'GOOGLE' && !currentUser.hasPassword) {
            passwordWarning.style.display = 'flex';
        } else {
            passwordWarning.style.display = 'none';
        }
    }
    
    // Reset to view mode
    document.getElementById('profileViewMode').style.display = 'flex';
    document.getElementById('profileEditMode').style.display = 'none';
}

// Toggle Edit Profile Mode
function toggleEditProfile() {
    const viewMode = document.getElementById('profileViewMode');
    const editMode = document.getElementById('profileEditMode');
    const editBtn = document.getElementById('editProfileBtn');
    
    if (editMode.style.display === 'none') {
        // Switch to edit mode
        document.getElementById('editFullName').value = currentUser.fullName || currentUser.username;
        document.getElementById('editAvatar').value = currentUser.avatar || '';
        document.getElementById('profileEmailStatic').textContent = currentUser.email;
        
        viewMode.style.display = 'none';
        editMode.style.display = 'flex';
        editBtn.innerHTML = '<i class="fas fa-eye"></i> Xem';
    } else {
        // Switch to view mode
        viewMode.style.display = 'flex';
        editMode.style.display = 'none';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa';
    }
}

// Handle Update Profile
async function handleUpdateProfile(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('editFullName').value.trim();
    const avatar = document.getElementById('editAvatar').value.trim();
    
    if (!fullName) {
        showToast('Tên người dùng không được để trống', 'error');
        return;
    }
    
    try {
        const updateData = { fullName };
        if (avatar) {
            updateData.avatar = avatar;
        }
        
        const response = await api.updateUser(currentUser.id, updateData);
        
        if (response.success) {
            // Update currentUser
            currentUser = { ...currentUser, ...response.data };
            
            // Update UI
            updateUserInfo();
            displayProfile();
            
            showToast('Cập nhật hồ sơ thành công', 'success');
        } else {
            showToast(response.message || 'Không thể cập nhật hồ sơ', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Có lỗi xảy ra khi cập nhật hồ sơ', 'error');
    }
}

// Handle Set Password
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
    // Disconnect socket
    disconnectSocket();
    
        const result = await api.register(
            currentUser.fullName || currentUser.username,
            currentUser.email,
            newPassword
        );
        
        if (result.success) {
            showToast('Đặt mật khẩu thành công!', 'success');
            // Cập nhật lại thông tin user
            const userData = await api.getCurrentUser();
            currentUser = userData.user || userData.data || userData;
            if (currentUser.fullName && !currentUser.username) {
                currentUser.username = currentUser.fullName;
            }
            // Form sẽ tự động ẩn vì displayProfile() được gọi lại
            displayProfile();
            // Reset form
            document.getElementById('setPasswordForm').reset();
        } else {
            showToast(result.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Password setup error:', error);
        showToast('Có lỗi xảy ra khi đặt mật khẩu', 'error');
    }
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
    } else if (viewName === 'requests') {
        // Reload requests khi mở view
        loadRequests();
    }
}

// Switch Requests Tab
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

document.getElementById('editProfileBtn').addEventListener('click', toggleEditProfile);
document.getElementById('editProfileForm').addEventListener('submit', handleUpdateProfile);
document.getElementById('cancelEditBtn').addEventListener('click', toggleEditProfile);

// Change Password Modal
document.getElementById('changePasswordBtn').addEventListener('click', openChangePasswordModal);
document.getElementById('closeChangePasswordModal').addEventListener('click', closeChangePasswordModal);
document.getElementById('cancelChangePasswordBtn').addEventListener('click', closeChangePasswordModal);
document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);

// Set Password Form
const setPasswordForm = document.getElementById('setPasswordForm');
if (setPasswordForm) {
    setPasswordForm.addEventListener('submit', handleSetPassword);
}

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

// Change Password Functions
function openChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'flex';
    // Reset form
    document.getElementById('changePasswordForm').reset();
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmNewPasswordInput').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu mới không khớp', 'error');
        return;
    }
    
    // Validate password
    const validation = validateFormData(
        { password: newPassword },
        { password: true }
    );
    
    if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
    }
    
    // Check if new password same as current
    if (currentPassword === newPassword) {
        showToast('Mật khẩu mới không được trùng với mật khẩu hiện tại', 'error');
        return;
    }
    
    try {
        const data = await api.changePassword(currentPassword, newPassword, confirmPassword);
        
        if (data.success) {
            showToast('Đổi mật khẩu thành công!', 'success');
            closeChangePasswordModal();
            document.getElementById('changePasswordForm').reset();
        } else {
            showToast(data.message || 'Đổi mật khẩu thất bại', 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showToast('Có lỗi xảy ra khi đổi mật khẩu', 'error');
    }
}
