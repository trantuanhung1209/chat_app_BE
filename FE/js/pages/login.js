// Login Page
import * as api from '../api.js';
import { showToast, getCookie } from '../utils.js';
import { API_URL } from '../config.js';

// Check if already logged in bằng cách gọi /auth/me
(async () => {
    try {
        await api.getCurrentUser();
        // Nếu không throw error, có nghĩa là đã đăng nhập
        window.location.href = 'app.html';
    } catch (error) {
        // Chưa đăng nhập hoặc session hết hạn, ở lại trang login
    }
})();

// Handle OAuth Redirect - Cookies đã được set từ backend
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('needSetPassword')) {
    const needSetPassword = urlParams.get('needSetPassword');
    
    if (needSetPassword === 'true') {
        // Hiện popup yêu cầu đặt mật khẩu
        showPasswordSetupModal();
    } else {
        // Đã có password, redirect về app
        window.location.href = 'app.html';
    }
}

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Cho phép nhận và gửi cookies
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('Login response data:', data);

        if (response.ok && data.success) {
            // Backend đã set httpOnly cookies
            showToast('Đăng nhập thành công!', 'success');
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 500);
        } else if (data.message === 'NO_PASSWORD_SET' && data.data?.user) {
            // Lưu thông tin user để pre-fill ở trang đăng ký
            sessionStorage.setItem('pendingUser', JSON.stringify(data.data.user));
            showToast('Tài khoản này chỉ đăng ký qua Google. Vui lòng đặt mật khẩu!', 'warning');
            setTimeout(() => {
                window.location.href = 'register.html';
            }, 2000);
        } else {
            showToast(data.message || 'Đăng nhập thất bại', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Có lỗi xảy ra khi đăng nhập', 'error');
    }
});

// Google Login
document.getElementById('googleLoginBtn').addEventListener('click', () => {
    window.location.href = `${API_URL}/auth/google`;
});

// Show Password Setup Modal
function showPasswordSetupModal() {
    // Remove tokens from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    const modal = document.getElementById('passwordSetupModal');
    modal.classList.add('active');
}

// Handle Password Setup
document.getElementById('passwordSetupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('setup-password').value;
    const confirmPassword = document.getElementById('setup-confirm-password').value;

    if (password !== confirmPassword) {
        showToast('Mật khẩu không khớp!', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return;
    }

    try {
        // Lấy thông tin user hiện tại
        const userData = await api.getCurrentUser();
        const user = userData.user || userData.data || userData;

        // Gọi API register để set password (backend sẽ update user nếu đã tồn tại)
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                fullName: user.fullName,
                email: user.email,
                password: password,
                avatar: user.avatar
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Đặt mật khẩu thành công!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Password setup error:', error);
        showToast('Có lỗi xảy ra khi đặt mật khẩu', 'error');
    }
});

// Skip Password Setup
document.getElementById('skipPasswordSetup')?.addEventListener('click', () => {
    // Redirect to app without setting password
    window.location.href = 'app.html';
});
