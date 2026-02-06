import { prisma } from "../config/db.js";
import bcrypt from 'bcrypt';
import logger from '../config/logger.js';

/**
 * Đổi mật khẩu cho user
 * @param {string} userId - ID của user
 * @param {string} currentPassword - Mật khẩu hiện tại
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Object} Kết quả
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        // 1. Lấy thông tin user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            logger.error('change_password_failed', {
                msg: 'User not found',
                userId,
                status_code: 404
            });
            throw new Error("Người dùng không tồn tại");
        }

        // 2. Kiểm tra xem user có mật khẩu chưa (trường hợp đăng nhập Google)
        if (!user.password) {
            logger.error('change_password_failed', {
                msg: 'User has no password set',
                userId,
                status_code: 400
            });
            throw new Error("Tài khoản chưa có mật khẩu. Vui lòng đặt mật khẩu trước");
        }

        // 3. Xác thực mật khẩu hiện tại
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            logger.error('change_password_failed', {
                msg: 'Current password incorrect',
                userId,
                status_code: 401
            });
            throw new Error("Mật khẩu hiện tại không đúng");
        }

        // 4. Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            logger.error('change_password_failed', {
                msg: 'New password same as old password',
                userId,
                status_code: 400
            });
            throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");
        }

        // 5. Hash mật khẩu mới và cập nhật
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        logger.info('change_password_success', {
            userId,
            status_code: 200
        });

        return {
            success: true,
            message: "Đổi mật khẩu thành công"
        };

    } catch (error) {
        logger.error('change_password_failed', {
            userId,
            error: { name: error.name, message: error.message },
            status_code: 500
        });
        throw error;
    }
};

/**
 * Đặt mật khẩu cho user lần đầu (trường hợp Google OAuth)
 * @param {string} userId - ID của user
 * @param {string} newPassword - Mật khẩu mới
 * @returns {Object} Kết quả
 */
const setPasswordForFirstTime = async (userId, newPassword) => {
    try {
        // 1. Lấy thông tin user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            logger.error('set_password_failed', {
                msg: 'User not found',
                userId,
                status_code: 404
            });
            throw new Error("Người dùng không tồn tại");
        }

        // 2. Kiểm tra user đã có mật khẩu chưa
        if (user.password) {
            logger.error('set_password_failed', {
                msg: 'User already has password',
                userId,
                status_code: 400
            });
            throw new Error("Tài khoản đã có mật khẩu. Vui lòng sử dụng chức năng đổi mật khẩu");
        }

        // 3. Hash và lưu mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        logger.info('set_password_success', {
            userId,
            status_code: 200
        });

        return {
            success: true,
            message: "Đặt mật khẩu thành công"
        };

    } catch (error) {
        logger.error('set_password_failed', {
            userId,
            error: { name: error.name, message: error.message },
            status_code: 500
        });
        throw error;
    }
};

export default {
    changePassword,
    setPasswordForFirstTime
};
