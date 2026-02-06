import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Tạo transporter cho email
const transporter = nodemailer.createTransport({
    service: 'gmail', // Hoặc service khác như 'outlook', 'yahoo'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App password, không phải password thường
    },
});

// Generate OTP 6 số
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi OTP qua email
export const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mã xác nhận đặt lại mật khẩu - Chat App',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #5865F2;">Đặt lại mật khẩu</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Chat App của mình.</p>
                    <p>Mã OTP của bạn là:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #ed4245;"><strong>Lưu ý:</strong> Mã OTP này sẽ hết hạn sau <strong>2 phút</strong>.</p>
                    <p>Vui lòng nhập mã ngay để đặt lại mật khẩu của bạn.</p>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="color: #999; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        
        logger.info('otp_email_sent', {
            email,
            messageId: info.messageId,
            status_code: 200
        });
        
        return true;
    } catch (error) {
        logger.error('otp_email_failed', {
            email,
            error: { name: error.name, message: error.message },
            status_code: 500
        });
        throw new Error('Không thể gửi email: ' + error.message);
    }
};

export default { generateOTP, sendOTPEmail };
