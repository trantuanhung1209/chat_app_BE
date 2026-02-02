// Main App Entry Point
import { initAuth, handleLogin, handleRegister, handleLogout, handleGoogleLogin, switchAuthTab, displayProfile } from './auth.js';
import { displayFriends, displayIncomingRequests, displayOutgoingRequests, filterFriends, updateRequestBadge, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, removeFriend } from './friends.js';
import { openChat, closeChat, sendMessage } from './chat.js';
import { searchUsers } from './search.js';

let friends = [];
let incomingRequests = [];
let outgoingRequests = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initializeEventListeners();
    setupCustomEvents();
});

// Initialize Event Listeners
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
        filterFriends(e.target.value, friends);
    });
    
    // Chat
    document.getElementById('closeChatBtn').addEventListener('click', closeChat);
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Setup Custom Events
function setupCustomEvents() {
    window.addEventListener('friendsLoaded', (e) => {
        friends = e.detail;
        displayFriends(friends);
    });
    
    window.addEventListener('requestsLoaded', (e) => {
        incomingRequests = e.detail.incoming;
        outgoingRequests = e.detail.outgoing;
        displayIncomingRequests(incomingRequests);
        displayOutgoingRequests(outgoingRequests);
        updateRequestBadge(incomingRequests.length, outgoingRequests.length);
    });
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
    
    // Load data for specific views
    if (viewName === 'profile') {
        displayProfile();
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

// Export functions to window for onclick handlers
window.acceptFriendRequest = acceptFriendRequest;
window.rejectFriendRequest = rejectFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.removeFriend = removeFriend;
window.openChat = openChat;
window.sendFriendRequest = sendFriendRequest;
