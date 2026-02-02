import * as api from './api.js';
import { showToast, getAvatar, getColorForUser } from './utils.js';

let currentPage = 1;
let currentQuery = '';
const pageSize = 10;

// Search Users
export async function searchUsers(page = 1) {
    const query = document.getElementById('userSearch').value.trim();
    
    if (!query) {
        showToast('Vui lòng nhập từ khóa tìm kiếm', 'warning');
        return;
    }
    
    currentQuery = query;
    currentPage = page;
    
    try {
        const data = await api.searchUsers(query, page, pageSize);
        displaySearchResults(data);
    } catch (error) {
        console.error('Search users error:', error);
        showToast('Không thể tìm kiếm người dùng', 'error');
        
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Lỗi tìm kiếm</h3>
                <p>Không thể tìm kiếm người dùng. Vui lòng thử lại.</p>
            </div>
        `;
    }
}

// Display Search Results
function displaySearchResults(response) {
    const resultsDiv = document.getElementById('searchResults');
    const users = response.data || [];
    const metadata = response.metadata || {};
    
    if (users.length === 0) {
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>Không tìm thấy kết quả</h3>
                <p>Không có người dùng nào phù hợp với từ khóa "${currentQuery}"</p>
            </div>
        `;
        return;
    }
    
    const usersHTML = users.map(user => {
        const username = user.fullName || user.username;
        const color = getColorForUser(user.id);
        
        let avatarHTML;
        if (user.avatar) {
            avatarHTML = `<img src="${user.avatar}" alt="${username}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const avatar = getAvatar(username);
            avatarHTML = avatar;
        }
        
        return `
            <div class="user-card">
                <div class="user-card-header">
                    <div class="user-avatar" style="background: ${user.avatar ? 'transparent' : color}">${avatarHTML}</div>
                    <div class="user-info">
                        <h4>${username}</h4>
                        <span>${user.email}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-small btn-primary" onclick="window.sendFriendRequest('${user.id}')">
                        Kết bạn
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Pagination
    const totalPages = metadata.totalPages || 1;
    const currentPageNum = metadata.page || 1;
    
    let paginationHTML = '';
    if (totalPages > 1) {
        paginationHTML = `
            <div class="pagination">
                <button class="btn btn-small" ${currentPageNum === 1 ? 'disabled' : ''} onclick="window.searchUsersPage(${currentPageNum - 1})">
                    ← Trước
                </button>
                <span class="page-info">Trang ${currentPageNum} / ${totalPages}</span>
                <button class="btn btn-small" ${currentPageNum === totalPages ? 'disabled' : ''} onclick="window.searchUsersPage(${currentPageNum + 1})">
                    Sau →
                </button>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = `
        <div class="search-results-header">
            <p>Tìm thấy ${metadata.total || 0} kết quả</p>
        </div>
        <div class="user-list">
            ${usersHTML}
        </div>
        ${paginationHTML}
    `;
}

// Export to window for pagination
window.searchUsersPage = searchUsers;
