// Input validation and sanitization utilities

/**
 * Sanitize HTML để chặn XSS
 */
export function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password (min 6 chars, không chứa ký tự đặc biệt nguy hiểm)
 */
export function isValidPassword(password) {
    if (password.length < 6) {
        return { valid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }
    return { valid: true };
}

/**
 * Validate OTP (chỉ chứa 6 số)
 */
export function isValidOTP(otp) {
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
}

/**
 * Sanitize text input - loại bỏ ký tự nguy hiểm
 */
export function sanitizeInput(input) {
    return input
        .trim()
        .replace(/[<>\"'\/]/g, '') // Loại bỏ ký tự HTML/SQL nguy hiểm
        .substring(0, 255); // Giới hạn độ dài
}

/**
 * Validate fullname (chỉ chữ cái, số, khoảng trắng)
 */
export function isValidFullName(name) {
    if (!name || name.trim().length < 2) {
        return { valid: false, message: 'Tên phải có ít nhất 2 ký tự' };
    }
    if (name.length > 100) {
        return { valid: false, message: 'Tên không được quá 100 ký tự' };
    }
    // Cho phép: chữ cái (có dấu), số, khoảng trắng
    const nameRegex = /^[a-zA-ZÀ-ỹ0-9\s]+$/;
    if (!nameRegex.test(name)) {
        return { valid: false, message: 'Tên chỉ được chứa chữ cái và số' };
    }
    return { valid: true };
}

/**
 * Validate URL (cho avatar)
 */
export function isValidURL(url) {
    if (!url || url.trim() === '') return true; // Optional field
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Escape special characters for display
 */
export function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;'
    };
    return text.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Validate form data trước khi submit
 */
export function validateFormData(data, schema) {
    const errors = [];
    
    if (schema.email && !isValidEmail(data.email)) {
        errors.push('Email không hợp lệ');
    }
    
    if (schema.password) {
        const passwordCheck = isValidPassword(data.password);
        if (!passwordCheck.valid) {
            errors.push(passwordCheck.message);
        }
    }
    
    if (schema.fullName) {
        const nameCheck = isValidFullName(data.fullName);
        if (!nameCheck.valid) {
            errors.push(nameCheck.message);
        }
    }
    
    if (schema.otp && !isValidOTP(data.otp)) {
        errors.push('Mã OTP phải là 6 chữ số');
    }
    
    if (schema.avatar && data.avatar && !isValidURL(data.avatar)) {
        errors.push('URL avatar không hợp lệ');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export default {
    sanitizeHTML,
    sanitizeInput,
    escapeHTML,
    isValidEmail,
    isValidPassword,
    isValidOTP,
    isValidFullName,
    isValidURL,
    validateFormData
};
