// Register Page
import * as api from '../api.js';
import { showToast, getCookie } from '../utils.js';
import { validateFormData, sanitizeInput } from '../validation.js';

// Check if already logged in
const tokens = api.getTokens();
if (tokens.accessToken) {
    window.location.href = 'app.html';
}

// Pre-fill thông tin nếu đến từ trang login (Google account cần đặt password)
const pendingUserStr = sessionStorage.getItem('pendingUser');
if (pendingUserStr) {
    try {
        const pendingUser = JSON.parse(pendingUserStr);
        
        if (pendingUser.fullName) {
            document.getElementById('register-username').value = pendingUser.fullName;
            document.getElementById('register-username').readOnly = true;
        }
        
        if (pendingUser.email) {
            document.getElementById('register-email').value = pendingUser.email;
            document.getElementById('register-email').readOnly = true;
        }
        
        sessionStorage.removeItem('pendingUser');
        
        // Hiển thị thông báo
        setTimeout(() => {
            const toast = document.getElementById('toast');
            toast.textContent = 'Vui lòng đặt mật khẩu cho tài khoản Google của bạn';
            toast.className = 'toast warning show';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }, 500);
    } catch (error) {
        console.error('Error parsing pending user:', error);
    }
}

// Register Form Handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validate input
    const validation = validateFormData(
        { fullName: username, email, password },
        { fullName: true, email: true, password: true }
    );
    
    if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Mật khẩu không khớp', 'error');
        return;
    }
    
    // Sanitize input trước khi gửi
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = email.trim().toLowerCase();
    
    try {
        const data = await api.register(sanitizedUsername, sanitizedEmail, password);
        
        if (data.success || data.data) {
            // Lấy token từ response body nếu có
            const accessToken = data.data?.accessToken;
            const refreshToken = data.data?.refreshToken;
            
            if (accessToken && refreshToken) {
                // Đăng ký thành công và có token
                api.setTokens(accessToken, refreshToken);
                showToast('Đăng ký thành công! Đang chuyển đến app...', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                // Đăng ký mới thông thường - tự động đăng nhập và chuyển về trang chủ
                showToast('Đăng ký thành công! Đang đăng nhập...', 'success');
                
                // Tự động đăng nhập
                try {
                    const loginData = await api.login(email, password);
                    if (loginData.success && loginData.data) {
                        // Lấy token từ response body
                        const { accessToken: loginAccessToken, refreshToken: loginRefreshToken } = loginData.data;
                        
                        if (loginAccessToken && loginRefreshToken) {
                            api.setTokens(loginAccessToken, loginRefreshToken);
                            showToast('Đăng nhập thành công! Đang chuyển đến app...', 'success');
                            setTimeout(() => {
                                window.location.href = 'app.html';
                            }, 1500);
                        } else {
                            showToast('Đăng ký thành công! Vui lòng đăng nhập', 'success');
                            setTimeout(() => {
                                window.location.href = 'login.html';
                            }, 1500);
                        }
                    } else {
                        showToast('Đăng ký thành công! Vui lòng đăng nhập', 'success');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1500);
                    }
                } catch (loginError) {
                    console.error('Auto login error:', loginError);
                    showToast('Đăng ký thành công! Vui lòng đăng nhập', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                }
            }
        } else {
            showToast(data.message || 'Đăng ký thất bại', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('Có lỗi xảy ra khi đăng ký', 'error');
    }
});
