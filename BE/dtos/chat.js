import Joi from 'joi';

export const validateCreateConversation = (data) => {
    const schema = Joi.object({
        name: Joi.string().max(100).allow(null, ''),
        avatar: Joi.string().uri().allow(null, ''),
        isGroup: Joi.boolean().required(),
        participantIds: Joi.array().items(Joi.string().uuid()).min(1).required()
    });
    return schema.validate(data);
};

export const validateSendMessage = (data) => {
    const schema = Joi.object({
        content: Joi.string().allow(null, ''),
        type: Joi.string().valid('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'SYSTEM').default('TEXT'),
        replyToId: Joi.string().uuid().allow(null),
        attachments: Joi.array().items(Joi.object({
            filename: Joi.string().required(),
            url: Joi.string().uri().required(),
            fileType: Joi.string().required(),
            fileSize: Joi.number().integer().required()
        }))
    }).or('content', 'attachments');
    return schema.validate(data);
};

export const validateAddParticipants = (data) => {
    const schema = Joi.object({
        userIds: Joi.array().items(Joi.string().uuid()).min(1).required()
    });
    return schema.validate(data);
};