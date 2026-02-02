// Utility Functions

// Get first letter for avatar
export function getAvatar(username) {
    return username ? username.charAt(0).toUpperCase() : '?';
}

// Render avatar (image or letter)
export function renderAvatar(user, size = 'medium') {
    const username = user.fullName || user.username || 'User';
    const avatar = user.avatar;
    const color = getColorForUser(user.id);
    
    const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : '';
    
    if (avatar) {
        return `<img src="${avatar}" alt="${username}" class="user-avatar ${sizeClass}" style="object-fit: cover;">`;
    } else {
        const letter = getAvatar(username);
        return `<div class="user-avatar ${sizeClass}" style="background: ${color}">${letter}</div>`;
    }
}

// Generate color based on user ID
export function getColorForUser(userId) {
    const colors = [
        '#5865F2', '#3ba55d', '#ed4245', '#faa61a', 
        '#5865F2', '#eb459e', '#00b0f4', '#f26522'
    ];
    const hash = userId ? userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    return colors[hash % colors.length];
}

// Show toast notification
export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format date
export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN');
}

// Format time
export function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Get cookie by name
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}
