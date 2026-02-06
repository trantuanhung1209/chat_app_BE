import rateLimit from 'express-rate-limit';

// Rate limiter chung cho tất cả API
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn 100 requests mỗi 15 phút
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau 15 phút'
    },
    standardHeaders: true, // Trả về rate limit info trong `RateLimit-*` headers
    legacyHeaders: false, // Tắt `X-RateLimit-*` headers
});

// Rate limiter nghiêm ngặt cho authentication (login, register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // Chỉ cho phép 5 lần thử trong 15 phút
    message: {
        success: false,
        message: 'Quá nhiều lần thử đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Tính cả request thành công
});

// Rate limiter cho password reset (chống spam OTP)
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 3, // Chỉ cho phép 3 lần yêu cầu OTP trong 1 giờ
    message: {
        success: false,
        message: 'Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 1 giờ'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Không tính request thành công
});

// Rate limiter cho verify OTP (chống brute force OTP)
export const otpVerifyLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 5, // Chỉ cho phép 5 lần thử OTP trong 5 phút
    message: {
        success: false,
        message: 'Quá nhiều lần thử mã OTP. Vui lòng thử lại sau 5 phút'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export default {
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    otpVerifyLimiter
};
