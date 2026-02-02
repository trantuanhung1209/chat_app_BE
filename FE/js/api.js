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
async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });
    
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
