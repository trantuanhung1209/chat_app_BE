import Joi from 'joi';

export const userSchema = Joi.object({
    fullName: Joi.string().trim().required().messages({
        'string.empty': 'Full name is required',
        'any.required': 'Full name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Email is invalid',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    }),
    avatar: Joi.string().uri().optional().messages({
        'string.uri': 'Avatar must be a valid URL'
    })
});

export const validateUser = (data) => {
    return userSchema.validate(data, { abortEarly: false });
};