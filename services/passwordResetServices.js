import { prisma } from "../config/db.js";
import { generateOTP, sendOTPEmail } from "./emailServices.js";
import bcrypt from 'bcrypt';
import logger from '../config/logger.js';

// Request OTP để reset password
const requestPasswordReset = async (email) => {
    try {
        // Kiểm tra user có tồn tại không
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            logger.error('password_reset_request_failed', {
                msg: 'User not found',
                email,
                status_code: 404
            });
            // Trả về thông báo chung chung để không lộ thông tin email có tồn tại hay không
            throw new Error("Không thể gửi mã OTP. Vui lòng kiểm tra lại thông tin");
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 phút

        // Xóa các OTP cũ chưa sử dụng của email này
        await prisma.passwordReset.deleteMany({
            where: {
                email,
                isUsed: false
            }
        });

        // Tạo OTP mới
        await prisma.passwordReset.create({
            data: {
                email,
                otp,
                expiresAt,
            }
        });

        // Gửi OTP qua email
        await sendOTPEmail(email, otp);

        logger.info('password_reset_otp_sent', {
            email,
            status_code: 200
        });

        return { success: true, message: "Mã OTP đã được gửi đến email của bạn" };
    } catch (error) {
        logger.error('password_reset_request_failed', {
            email,
            error: { name: error.name, message: error.message },
            status_code: 500
        });
        throw error;
    }
};

// Verify OTP
const verifyOTP = async (email, otp) => {
    try {
        // Tìm OTP hợp lệ
        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                email,
                otp,
                isUsed: false,
                expiresAt: {
                    gte: new Date() // OTP chưa hết hạn
                }
            }
        });

        if (!resetRecord) {
            logger.error('otp_verification_failed', {
                msg: 'Invalid or expired OTP',
                email,
                status_code: 400
            });
            throw new Error("Thông tin xác thực không chính xác. Vui lòng thử lại");
        }

        logger.info('otp_verified', {
            email,
            status_code: 200
        });

        return { success: true, resetId: resetRecord.id };
    } catch (error) {
        logger.error('otp_verification_failed', {
            email,
            error: { name: error.name, message: error.message },
            status_code: 500
        });
        throw error;
    }
};

// Reset password với OTP đã verify
const resetPassword = async (email, otp, newPassword) => {
    try {
        // Verify OTP lại một lần nữa
        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                email,
                otp,
                isUsed: false,
                expiresAt: {
                    gte: new Date()
                }
            }
        });

        if (!resetRecord) {
            throw new Error("Không thể đặt lại mật khẩu. Vui lòng thử lại");
        }

        // Hash password mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        // Đánh dấu OTP đã được sử dụng
        await prisma.passwordReset.update({
            where: { id: resetRecord.id },
            data: { isUsed: true }
        });

        logger.info('password_reset_success', {
            email,
            status_code: 200
        });

        return { success: true, message: "Đặt lại mật khẩu thành công" };
    } catch (error) {
        logger.error('password_reset_failed', {
            email,
            error: { name: error.name, message: error.message },
            status_code: 500
        });
        throw error;
    }
};

// Cleanup expired OTPs (có thể chạy định kỳ)
const cleanupExpiredOTPs = async () => {
    try {
        const result = await prisma.passwordReset.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });

        logger.info('expired_otps_cleaned', {
            count: result.count,
            status_code: 200
        });

        return result.count;
    } catch (error) {
        logger.error('cleanup_expired_otps_failed', {
            error: { name: error.name, message: error.message },
            status_code: 500
        });
        throw error;
    }
};

export default {
    requestPasswordReset,
    verifyOTP,
    resetPassword,
    cleanupExpiredOTPs
};
