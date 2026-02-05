// API Service
import { API_URL } from './config.js';

let accessToken = null;
let refreshToken = null;

// Set tokens
export function setTokens(access, refresh) {
    accessToken = access;
    refreshToken = refresh;
    if (access) localStorage.setItem('accessToken', access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
}

// Get tokens
export function getTokens() {
    return {
        accessToken: accessToken || localStorage.getItem('accessToken'),
        refreshToken: refreshToken || localStorage.getItem('refreshToken')
    };
}

// Clear tokens
export function clearTokens() {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

// API request wrapper (Cookie-based authentication)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

async function apiRequest(url, options = {}, retryCount = 0) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include', // Quan trọng: Cho phép gửi và nhận cookies
    });
    
    // Xử lý 401 - Unauthorized
    if (response.status === 401 && retryCount === 0 && url !== '/auth/refresh' && url !== '/auth/login') {
        // Kiểm tra xem có refreshToken không (trong cookie hoặc localStorage)
        const hasRefreshToken = document.cookie.includes('refreshToken') || localStorage.getItem('refreshToken');
        
        if (!hasRefreshToken) {
            // Không có refreshToken, redirect về login (nếu chưa ở trang login)
            clearTokens();
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'login.html' && currentPage !== 'register.html') {
                window.location.href = 'login.html';
            }
            throw new Error('No refresh token available');
        }
        
        if (isRefreshing) {
            // Nếu đang refresh, đợi refresh xong rồi retry
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => {
                return apiRequest(url, options, retryCount + 1);
            }).catch(err => {
                throw err;
            });
        }
        
        isRefreshing = true;
        
        try {
            // Gọi refresh token
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Gửi refresh token cookie
                body: JSON.stringify({}),
            });
            
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                
                // Refresh thành công, cookies đã được cập nhật
                isRefreshing = false;
                processQueue(null, true);
                
                // Retry request ban đầu
                return apiRequest(url, options, retryCount + 1);
            } else {
                throw new Error('Refresh token failed');
            }
        } catch (error) {
            isRefreshing = false;
            processQueue(error, null);
            
            // Refresh thất bại, redirect về login (nếu chưa ở trang login)
            clearTokens();
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'login.html' && currentPage !== 'register.html') {
                window.location.href = 'login.html';
            }
            throw error;
        }
    }
    
    return response;
}

// Auth APIs
export async function login(email, password) {
    const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function register(username, email, password) {
    const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName: username, email, password }),
    });
    return response.json();
}

export async function logout() {
    const response = await apiRequest('/auth/logout', {
        method: 'POST',
    });
    return response.json();
}

export async function getCurrentUser() {
    const response = await apiRequest('/auth/me');
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
}

export async function refreshAccessToken() {
    const response = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
    });
    
    if (!response.ok) throw new Error('Refresh failed');
    const data = await response.json();
    return data;
}

// Friend APIs
export async function getFriends() {
    const response = await apiRequest('/friends');
    if (!response.ok) throw new Error('Failed to fetch friends');
    return response.json();
}

export async function getIncomingRequests() {
    const response = await apiRequest('/friends/requests/incoming');
    if (!response.ok) throw new Error('Failed to fetch incoming requests');
    return response.json();
}

export async function getOutgoingRequests(page = 1, limit = 10) {
    const response = await apiRequest(`/friends/requests/outgoing?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch outgoing requests');
    return response.json();
}

export async function sendFriendRequest(receiverId) {
    const response = await apiRequest('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ toUserId: receiverId }),
    });
    return response.json();
}

export async function acceptFriendRequest(requestId) {
    console.log('API acceptFriendRequest - requestId:', requestId, 'type:', typeof requestId);
    const response = await apiRequest('/friends/accept', {
        method: 'POST',
        body: JSON.stringify({ requestId }),
    });
    return response.json();
}

export async function rejectFriendRequest(requestId) {
    const response = await apiRequest('/friends/reject', {
        method: 'POST',
        body: JSON.stringify({ requestId }),
    });
    return response.json();
}

export async function cancelFriendRequest(requestId) {
    const response = await apiRequest('/friends/cancel', {
        method: 'POST',
        body: JSON.stringify({ requestId }),
    });
    return response.json();
}

export async function removeFriend(friendId) {
    const response = await apiRequest('/friends/unfriend', {
        method: 'POST',
        body: JSON.stringify({ friendId }),
    });
    return response.json();
}

// User APIs
export async function searchUsers(query, page = 1, limit = 10) {
    const response = await apiRequest(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
}

export async function updateUser(userId, userData) {
    const response = await apiRequest(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
}

// Change Password APIs
export async function changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await apiRequest('/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    return response.json();
}

export async function setPasswordFirstTime(newPassword, confirmPassword) {
    const response = await apiRequest('/change-password/set', {
        method: 'POST',
        body: JSON.stringify({ newPassword, confirmPassword }),
    });
    return response.json();
}
