import passwordResetServices from "../services/passwordResetServices.js";
import { successResponse, errorResponse } from '../helpers/responseHelper.js';
import Joi from 'joi';

// Validation schemas
const requestResetSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    })
});

const verifyOTPSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required().messages({
        'string.length': 'Mã OTP phải có 6 số',
        'any.required': 'Mã OTP là bắt buộc'
    })
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu mới là bắt buộc'
    })
});

// Request OTP
const requestPasswordReset = async (req, res) => {
    try {
        const { error } = requestResetSchema.validate(req.body);
        if (error) {
            return errorResponse(res, 400, error.details[0].message);
        }

        const { email } = req.body;
        const result = await passwordResetServices.requestPasswordReset(email);
        
        return successResponse(res, 200, result.message);
    } catch (error) {
        return errorResponse(res, 500, 'Không thể xử lý yêu cầu. Vui lòng thử lại sau');
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { error } = verifyOTPSchema.validate(req.body);
        if (error) {
            return errorResponse(res, 400, 'Thông tin không hợp lệ');
        }

        const { email, otp } = req.body;
        const result = await passwordResetServices.verifyOTP(email, otp);
        
        return successResponse(res, 200, 'Mã OTP hợp lệ', result);
    } catch (error) {
        return errorResponse(res, 400, 'Thông tin xác thực không chính xác. Vui lòng thử lại');
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { error } = resetPasswordSchema.validate(req.body);
        if (error) {
            return errorResponse(res, 400, 'Thông tin không hợp lệ');
        }

        const { email, otp, newPassword } = req.body;
        const result = await passwordResetServices.resetPassword(email, otp, newPassword);
        
        return successResponse(res, 200, result.message);
    } catch (error) {
        return errorResponse(res, 400, 'Không thể đặt lại mật khẩu. Vui lòng thử lại');
    }
};

export default {
    requestPasswordReset,
    verifyOTP,
    resetPassword
};
