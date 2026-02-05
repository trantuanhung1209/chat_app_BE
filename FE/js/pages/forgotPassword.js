// Forgot Password Page
import { API_URL } from '../config.js';
import { showToast } from '../utils.js';

let currentEmail = '';
let currentOTP = '';
let countdownTimer = null;
let remainingTime = 0;

// Countdown timer function
function startCountdown(seconds) {
    clearInterval(countdownTimer);
    remainingTime = seconds;
    const resendBtn = document.getElementById('resendOTPBtn');
    const resendText = document.getElementById('resend-text');
    const timerDisplay = document.getElementById('otp-timer');
    
    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.6';
    resendBtn.style.cursor = 'not-allowed';
    
    countdownTimer = setInterval(() => {
        remainingTime--;
        
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerDisplay.textContent = `Có thể gửi lại sau ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (remainingTime <= 0) {
            clearInterval(countdownTimer);
            resendBtn.disabled = false;
            resendBtn.style.opacity = '1';
            resendBtn.style.cursor = 'pointer';
            timerDisplay.textContent = '';
        }
    }, 1000);
}

// Step management
function showStep(stepId) {
    document.querySelectorAll('.reset-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// Step 1: Request OTP
document.getElementById('requestOTPForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('reset-email').value;
    currentEmail = email;

    try {
        const response = await fetch(`${API_URL}/password-reset/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Mã OTP đã được gửi đến email của bạn!', 'success');
            document.getElementById('display-email').textContent = email;
            showStep('step-verify-otp');
            startCountdown(120); // 2 phút = 120 giây
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Request OTP error:', error);
        showToast('Có lỗi xảy ra khi gửi mã OTP', 'error');
    }
});

// Step 2: Verify OTP
document.getElementById('verifyOTPForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const otp = document.getElementById('otp-code').value;
    currentOTP = otp;

    if (otp.length !== 6) {
        showToast('Mã OTP phải có 6 số', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/password-reset/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentEmail, otp }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Mã OTP hợp lệ!', 'success');
            showStep('step-reset-password');
        } else {
            showToast(data.message || 'Mã OTP không hợp lệ', 'error');
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        showToast('Có lỗi xảy ra khi xác nhận OTP', 'error');
    }
});

// Resend OTP
document.getElementById('resendOTPBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/password-reset/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentEmail }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Mã OTP mới đã được gửi!', 'success');
            document.getElementById('otp-code').value = '';
            startCountdown(120); // 2 phút = 120 giây
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showToast('Có lỗi xảy ra khi gửi lại mã OTP', 'error');
    }
});

// Step 3: Reset Password
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;

    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu không khớp!', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/password-reset/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: currentEmail,
                otp: currentOTP,
                newPassword
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast('Đặt lại mật khẩu thành công!', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showToast('Có lỗi xảy ra khi đặt lại mật khẩu', 'error');
    }
});

// Auto-focus và auto-format OTP input
document.getElementById('otp-code').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});
