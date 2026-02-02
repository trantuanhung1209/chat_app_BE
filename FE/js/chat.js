import { getAvatar, getColorForUser, showToast } from './utils.js';

let currentChatUser = null;

// Open Chat
export function openChat(userId, username, avatarUrl = '') {
    currentChatUser = { id: userId, username, avatar: avatarUrl };
    
    const chatAvatarElement = document.getElementById('chatUserAvatar');
    
    if (avatarUrl) {
        chatAvatarElement.innerHTML = `<img src="${avatarUrl}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        chatAvatarElement.style.background = 'transparent';
    } else {
        const avatar = getAvatar(username);
        const color = getColorForUser(userId);
        chatAvatarElement.textContent = avatar;
        chatAvatarElement.style.background = color;
    }
    
    document.getElementById('chatUsername').textContent = username;
    document.getElementById('chatPanel').classList.add('active');
    
    loadChatMessages(userId);
}

// Close Chat
export function closeChat() {
    document.getElementById('chatPanel').classList.remove('active');
    currentChatUser = null;
}

// Load Chat Messages
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

// Send Message
export function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !currentChatUser) return;
    
    // Placeholder - Backend cần implement chat API
    showToast('Tính năng chat đang được phát triển', 'warning');
    input.value = '';
}
