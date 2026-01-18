import Joi from 'joi';

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required',
    })
});

export const userSchema = Joi.object({
    fullName: Joi.string().trim().required().messages({
        'string.empty': 'Full name is required',
        'any.required': 'Full name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required',
    }),
    avatar: Joi.string().uri().optional().allow(null)
});

export const validateUser = (data) => {
    return userSchema.validate(data, { abortEarly: false });
};

export const validateLogin = (data) => {
    return loginSchema.validate(data, { abortEarly: false });
};