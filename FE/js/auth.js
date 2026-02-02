import * as api from './api.js';
import { showToast, getAvatar, getColorForUser, formatDate } from './utils.js';
import { API_URL } from './config.js';

let currentUser = null;
let friends = [];
let incomingRequests = [];
let outgoingRequests = [];

// Initialize Auth Module
export function initAuth() {
    handleOAuthRedirect();
    checkAuth();
}

// Handle OAuth Redirect
function handleOAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlAccessToken = urlParams.get('accessToken');
    const urlRefreshToken = urlParams.get('refreshToken');
    
    if (urlAccessToken && urlRefreshToken) {
        api.setTokens(urlAccessToken, urlRefreshToken);
        // Remove tokens from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check Authentication
function checkAuth() {
    const tokens = api.getTokens();
    
    if (tokens.accessToken) {
        fetchCurrentUser();
    } else {
        showPage('auth-page');
    }
}

// Fetch Current User
async function fetchCurrentUser() {
    try {
        const data = await api.getCurrentUser();
        currentUser = data.user || data.data || data;
        updateUserInfo();
        showPage('app-page');
        loadFriends();
        loadRequests();
    } catch (error) {
        console.error('Fetch user error:', error);
        // Try refresh token
        try {
            const data = await api.refreshAccessToken();
            if (data.accessToken) {
                api.setTokens(data.accessToken, data.refreshToken);
                await fetchCurrentUser();
            } else {
                throw new Error('Refresh failed');
            }
        } catch (refreshError) {
            console.error('Refresh token error:', refreshError);
            api.clearTokens();
            showPage('auth-page');
        }
    }
}

// Login Handler
export async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const data = await api.login(email, password);
        
        if (data.success || data.accessToken) {
            api.setTokens(data.accessToken, data.refreshToken);
            await fetchCurrentUser();
            showToast('Đăng nhập thành công!', 'success');
            showPage('app-page');
            document.getElementById('loginForm').reset();
        } else {
            showToast(data.message || 'Đăng nhập thất bại', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Có lỗi xảy ra khi đăng nhập', 'error');
    }
}

// Register Handler
export async function handleRegister(e) {
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
        const data = await api.register(username, email, password);
        
        if (data.success || data.userId) {
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

// Logout Handler
export async function handleLogout() {
    try {
        await api.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    api.clearTokens();
    currentUser = null;
    
    showToast('Đã đăng xuất', 'success');
    showPage('auth-page');
}

// Google Login
export function handleGoogleLogin() {
    window.location.href = `${API_URL}/auth/google`;
}

// Switch Auth Tab
export function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
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
        window.dispatchEvent(new CustomEvent('friendsLoaded', { detail: friends }));
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
            api.getOutgoingRequests(),
        ]);
        
        incomingRequests = incomingData.requests || incomingData.data || incomingData;
        outgoingRequests = outgoingData.requests || outgoingData.data || outgoingData;
        
        window.dispatchEvent(new CustomEvent('requestsLoaded', { 
            detail: { incoming: incomingRequests, outgoing: outgoingRequests }
        }));
    } catch (error) {
        console.error('Load requests error:', error);
    }
}

// Display Profile
export function displayProfile() {
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

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Reload friends
export function reloadFriends() {
    loadFriends();
}

// Reload requests
export function reloadRequests() {
    loadRequests();
}
