import Joi from 'joi';

export const friendSchema = Joi.object({
    fromUserId: Joi.string().uuid().required().messages({
        'string.base': 'fromUserId must be a string',
        'string.uuid': 'fromUserId must be a valid UUID',
        'any.required': 'fromUserId is required'
    }),
    toUserId: Joi.string().uuid().required().messages({
        'string.base': 'toUserId must be a string',
        'string.uuid': 'toUserId must be a valid UUID',
        'any.required': 'toUserId is required'
    })
});

export const validateFriend = (data) => {
    return friendSchema.validate(data, { abortEarly: false });
};