import changePasswordServices from "../services/changePasswordServices.js";
import { successResponse, errorResponse } from '../helpers/responseHelper.js';
import Joi from 'joi';

// Validation schema cho đổi mật khẩu
const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu hiện tại phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu hiện tại là bắt buộc'
    }),
    newPassword: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu mới là bắt buộc'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Xác nhận mật khẩu không khớp',
        'any.required': 'Xác nhận mật khẩu là bắt buộc'
    })
});

// Validation schema cho đặt mật khẩu lần đầu
const setPasswordSchema = Joi.object({
    newPassword: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là bắt buộc'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Xác nhận mật khẩu không khớp',
        'any.required': 'Xác nhận mật khẩu là bắt buộc'
    })
});

/**
 * Controller đổi mật khẩu
 */
const changePassword = async (req, res) => {
    try {
        // Validate input
        const { error } = changePasswordSchema.validate(req.body);
        if (error) {
            return errorResponse(res, 400, error.details[0].message);
        }

        const userId = req.user.id; // Từ authenticateAccessToken middleware
        const { currentPassword, newPassword } = req.body;

        const result = await changePasswordServices.changePassword(
            userId,
            currentPassword,
            newPassword
        );

        return successResponse(res, 200, result.message);
    } catch (error) {
        // Trả về thông báo lỗi cụ thể từ service
        return errorResponse(res, 400, error.message);
    }
};

/**
 * Controller đặt mật khẩu lần đầu (cho Google OAuth users)
 */
const setPassword = async (req, res) => {
    try {
        // Validate input
        const { error } = setPasswordSchema.validate(req.body);
        if (error) {
            return errorResponse(res, 400, error.details[0].message);
        }

        const userId = req.user.id; // Từ authenticateAccessToken middleware
        const { newPassword } = req.body;

        const result = await changePasswordServices.setPasswordForFirstTime(
            userId,
            newPassword
        );

        return successResponse(res, 200, result.message);
    } catch (error) {
        return errorResponse(res, 400, error.message);
    }
};

export default {
    changePassword,
    setPassword
};
