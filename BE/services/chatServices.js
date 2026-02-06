import { prisma } from '../config/db.js';
import logger from '../config/logger.js';
import { getIO } from './socketHelperServices.js';

// ==================== CONVERSATION ====================
const getConversations = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    
    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: {
                    userId: userId,
                    leftAt: null
                }
            }
        },
        include: {
            participants: {
                where: { leftAt: null },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                            isOnline: true,
                            lastSeen: true
                        }
                    }
                }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            createdAt: {
                                gt: await getLastReadTime(userId)
                            },
                            senderId: {
                                not: userId
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            lastMessageAt: 'desc'
        },
        skip,
        take: limit
    });

    const total = await prisma.conversation.count({
        where: {
            participants: {
                some: {
                    userId: userId,
                    leftAt: null
                }
            }
        }
    });

    return {
        conversations,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getLastReadTime = async (userId) => {
    const participant = await prisma.conversationParticipant.findFirst({
        where: { userId },
        orderBy: { lastReadAt: 'desc' },
        select: { lastReadAt: true }
    });
    return participant?.lastReadAt || new Date(0);
};

const getConversationById = async (conversationId, userId) => {
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            participants: {
                some: {
                    userId: userId,
                    leftAt: null
                }
            }
        },
        include: {
            participants: {
                where: { leftAt: null },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                            email: true,
                            isOnline: true,
                            lastSeen: true
                        }
                    }
                }
            }
        }
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    return conversation;
};

const createConversation = async (conversationData) => {
    const { name, avatar, isGroup, participantIds, createdBy } = conversationData;
    
    // Nếu là chat 1-1, kiểm tra xem đã có conversation chưa
    if (!isGroup && participantIds.length === 1) {
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                isGroup: false,
                participants: {
                    every: {
                        userId: {
                            in: [createdBy, participantIds[0]]
                        }
                    }
                }
            },
            include: {
                participants: {
                    where: { leftAt: null },
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                avatar: true,
                                isOnline: true,
                                lastSeen: true
                            }
                        }
                    }
                }
            }
        });

        if (existingConversation) {
            return existingConversation;
        }
    }

    // Tạo conversation mới
    const allParticipantIds = [createdBy, ...participantIds.filter(id => id !== createdBy)];
    
    const conversation = await prisma.conversation.create({
        data: {
            name: isGroup ? name : null,
            avatar: isGroup ? avatar : null,
            isGroup,
            createdBy,
            participants: {
                create: allParticipantIds.map((userId, index) => ({
                    userId,
                    role: index === 0 ? 'ADMIN' : 'MEMBER'
                }))
            }
        },
        include: {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                            isOnline: true,
                            lastSeen: true
                        }
                    }
                }
            }
        }
    });

    // Emit socket event to all participants
    const io = getIO();
    allParticipantIds.forEach(userId => {
        io.to(`user:${userId}`).emit('conversation:created', conversation);
    });

    logger.info('conversation_created', {
        conversation_id: conversation.id,
        created_by: createdBy,
        is_group: isGroup,
        participant_count: allParticipantIds.length
    });

    return conversation;
};

const updateConversation = async (conversationId, userId, updateData) => {
    // Kiểm tra quyền admin
    const participant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId,
            leftAt: null,
            role: 'ADMIN'
        }
    });

    if (!participant) {
        throw new Error('Only admin can update conversation');
    }

    const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: updateData,
        include: {
            participants: {
                where: { leftAt: null },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true
                        }
                    }
                }
            }
        }
    });

    // Emit socket event
    const io = getIO();
    conversation.participants.forEach(p => {
        io.to(`user:${p.userId}`).emit('conversation:updated', conversation);
    });

    return conversation;
};

const deleteConversation = async (conversationId, userId) => {
    // Kiểm tra quyền admin
    const participant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId,
            leftAt: null,
            role: 'ADMIN'
        }
    });

    if (!participant) {
        throw new Error('Only admin can delete conversation');
    }

    // Get all participants before deleting
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            participants: {
                where: { leftAt: null }
            }
        }
    });

    await prisma.conversation.delete({
        where: { id: conversationId }
    });

    // Emit socket event
    const io = getIO();
    conversation.participants.forEach(p => {
        io.to(`user:${p.userId}`).emit('conversation:deleted', { conversationId });
    });

    logger.info('conversation_deleted', {
        conversation_id: conversationId,
        deleted_by: userId
    });
};

// ==================== PARTICIPANTS ====================
const addParticipants = async (conversationId, adminId, userIds) => {
    // Kiểm tra quyền admin
    const adminParticipant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId: adminId,
            leftAt: null,
            role: 'ADMIN'
        }
    });

    if (!adminParticipant) {
        throw new Error('Only admin can add participants');
    }

    // Kiểm tra conversation có phải là group không
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation.isGroup) {
        throw new Error('Cannot add participants to direct conversation');
    }

    const participants = await prisma.$transaction(
        userIds.map(userId => 
            prisma.conversationParticipant.create({
                data: {
                    conversationId,
                    userId,
                    role: 'MEMBER'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true
                        }
                    }
                }
            })
        )
    );

    // Emit socket event
    const io = getIO();
    const allParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId, leftAt: null }
    });

    allParticipants.forEach(p => {
        io.to(`user:${p.userId}`).emit('conversation:participants_added', {
            conversationId,
            participants
        });
    });

    return participants;
};

const removeParticipant = async (conversationId, adminId, userId) => {
    // Kiểm tra quyền admin
    const adminParticipant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId: adminId,
            leftAt: null,
            role: 'ADMIN'
        }
    });

    if (!adminParticipant) {
        throw new Error('Only admin can remove participants');
    }

    await prisma.conversationParticipant.updateMany({
        where: {
            conversationId,
            userId,
            leftAt: null
        },
        data: {
            leftAt: new Date()
        }
    });

    // Emit socket event
    const io = getIO();
    io.to(`user:${userId}`).emit('conversation:removed', { conversationId });
    
    const remainingParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId, leftAt: null }
    });
    
    remainingParticipants.forEach(p => {
        io.to(`user:${p.userId}`).emit('conversation:participant_removed', {
            conversationId,
            userId
        });
    });
};

const leaveConversation = async (conversationId, userId) => {
    await prisma.conversationParticipant.updateMany({
        where: {
            conversationId,
            userId,
            leftAt: null
        },
        data: {
            leftAt: new Date()
        }
    });

    // Emit socket event
    const io = getIO();
    const remainingParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId, leftAt: null }
    });
    
    remainingParticipants.forEach(p => {
        io.to(`user:${p.userId}`).emit('conversation:participant_left', {
            conversationId,
            userId
        });
    });

    logger.info('conversation_left', {
        conversation_id: conversationId,
        user_id: userId
    });
};

const updateParticipantRole = async (conversationId, adminId, userId, role) => {
    // Kiểm tra quyền admin
    const adminParticipant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId: adminId,
            leftAt: null,
            role: 'ADMIN'
        }
    });

    if (!adminParticipant) {
        throw new Error('Only admin can update participant roles');
    }

    const participant = await prisma.conversationParticipant.updateMany({
        where: {
            conversationId,
            userId,
            leftAt: null
        },
        data: { role }
    });

    // Emit socket event
    const io = getIO();
    const allParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId, leftAt: null }
    });
    
    allParticipants.forEach(p => {
        io.to(`user:${p.userId}`).emit('conversation:role_updated', {
            conversationId,
            userId,
            role
        });
    });

    return participant;
};

// ==================== MESSAGES ====================
const getMessages = async (conversationId, userId, page = 1, limit = 50, before = null) => {
    // Kiểm tra user có trong conversation không
    const participant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId,
            leftAt: null
        }
    });

    if (!participant) {
        throw new Error('You are not a participant of this conversation');
    }

    const skip = (page - 1) * limit;
    
    const whereClause = {
        conversationId,
        deletedAt: null
    };

    if (before) {
        whereClause.createdAt = {
            lt: new Date(before)
        };
    }

    const messages = await prisma.message.findMany({
        where: whereClause,
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    avatar: true
                }
            },
            replyTo: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                }
            },
            attachments: true,
            reactions: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true
                        }
                    }
                }
            },
            readReceipts: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip,
        take: limit
    });

    const total = await prisma.message.count({
        where: whereClause
    });

    return {
        messages: messages.reverse(), // Đảo ngược để hiển thị đúng thứ tự
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const sendMessage = async (conversationId, messageData) => {
    const { senderId, content, type, replyToId, attachments } = messageData;

    // Kiểm tra user có trong conversation không
    const participant = await prisma.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId: senderId,
            leftAt: null
        }
    });

    if (!participant) {
        throw new Error('You are not a participant of this conversation');
    }

    // Tạo message
    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId,
            content,
            type: type || 'TEXT',
            replyToId,
            attachments: attachments ? {
                create: attachments
            } : undefined
        },
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    avatar: true
                }
            },
            replyTo: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                }
            },
            attachments: true
        }
    });

    // Update lastMessageAt của conversation
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    });

    // Emit socket event to all participants
    const io = getIO();
    const allParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId, leftAt: null }
    });

    allParticipants.forEach(p => {
        io.to(`user:${p.userId}`).emit('message:new', message);
    });

    logger.info('message_sent', {
        message_id: message.id,
        conversation_id: conversationId,
        sender_id: senderId,
        type: type || 'TEXT'
    });

    return message;
};

const editMessage = async (messageId, userId, content) => {
    const existingMessage = await prisma.message.findUnique({
        where: { id: messageId }
    });

    if (!existingMessage) {
        throw new Error('Message not found');
    }

    if (existingMessage.senderId !== userId) {
        throw new Error('You can only edit your own messages');
    }

    if (existingMessage.deletedAt) {
        throw new Error('Cannot edit deleted message');
    }

    const message = await prisma.message.update({
        where: { id: messageId },
        data: {
            content,
            isEdited: true
        },
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    avatar: true
                }
            }
        }
    });

    // Emit socket event
    const io = getIO();
    const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: message.conversationId, leftAt: null }
    });

    participants.forEach(p => {
        io.to(`user:${p.userId}`).emit('message:edited', message);
    });

    return message;
};

const deleteMessage = async (messageId, userId) => {
    const existingMessage = await prisma.message.findUnique({
        where: { id: messageId }
    });

    if (!existingMessage) {
        throw new Error('Message not found');
    }

    if (existingMessage.senderId !== userId) {
        throw new Error('You can only delete your own messages');
    }

    await prisma.message.update({
        where: { id: messageId },
        data: {
            deletedAt: new Date()
        }
    });

    // Emit socket event
    const io = getIO();
    const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: existingMessage.conversationId, leftAt: null }
    });

    participants.forEach(p => {
        io.to(`user:${p.userId}`).emit('message:deleted', { messageId });
    });

    logger.info('message_deleted', {
        message_id: messageId,
        user_id: userId
    });
};

// ==================== REACTIONS ====================
const addReaction = async (messageId, userId, emoji) => {
    // Kiểm tra xem đã có reaction này chưa
    const existingReaction = await prisma.reaction.findFirst({
        where: {
            messageId,
            userId,
            emoji
        }
    });

    if (existingReaction) {
        return existingReaction;
    }

    const reaction = await prisma.reaction.create({
        data: {
            messageId,
            userId,
            emoji
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    avatar: true
                }
            }
        }
    });

    // Emit socket event
    const io = getIO();
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: { include: { participants: { where: { leftAt: null } } } } }
    });

    message.conversation.participants.forEach(p => {
        io.to(`user:${p.userId}`).emit('message:reaction_added', {
            messageId,
            reaction
        });
    });

    return reaction;
};

const removeReaction = async (reactionId, messageId, userId) => {
    const reaction = await prisma.reaction.findUnique({
        where: { id: reactionId }
    });

    if (!reaction) {
        throw new Error('Reaction not found');
    }

    if (reaction.userId !== userId) {
        throw new Error('You can only remove your own reactions');
    }

    await prisma.reaction.delete({
        where: { id: reactionId }
    });

    // Emit socket event
    const io = getIO();
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: { include: { participants: { where: { leftAt: null } } } } }
    });

    message.conversation.participants.forEach(p => {
        io.to(`user:${p.userId}`).emit('message:reaction_removed', {
            messageId,
            reactionId
        });
    });
};

// ==================== READ RECEIPTS ====================
const markAsRead = async (messageId, userId) => {
    const existingReceipt = await prisma.readReceipt.findFirst({
        where: {
            messageId,
            userId
        }
    });

    if (existingReceipt) {
        return existingReceipt;
    }

    const receipt = await prisma.readReceipt.create({
        data: {
            messageId,
            userId
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true
                }
            }
        }
    });

    // Emit socket event
    const io = getIO();
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { sender: true }
    });

    io.to(`user:${message.senderId}`).emit('message:read', {
        messageId,
        userId,
        readAt: receipt.readAt
    });

    return receipt;
};

const markConversationAsRead = async (conversationId, userId) => {
    // Update lastReadAt của participant
    await prisma.conversationParticipant.updateMany({
        where: {
            conversationId,
            userId,
            leftAt: null
        },
        data: {
            lastReadAt: new Date()
        }
    });

    // Get all unread messages và tạo read receipts
    const unreadMessages = await prisma.message.findMany({
        where: {
            conversationId,
            senderId: {
                not: userId
            },
            readReceipts: {
                none: {
                    userId
                }
            }
        }
    });

    if (unreadMessages.length > 0) {
        await prisma.readReceipt.createMany({
            data: unreadMessages.map(msg => ({
                messageId: msg.id,
                userId
            })),
            skipDuplicates: true
        });
    }

    // Emit socket event
    const io = getIO();
    const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId, leftAt: null }
    });

    participants.forEach(p => {
        if (p.userId !== userId) {
            io.to(`user:${p.userId}`).emit('conversation:read', {
                conversationId,
                userId,
                readAt: new Date()
            });
        }
    });
};

// ==================== SEARCH ====================
const searchMessages = async (userId, query, conversationId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const whereClause = {
        content: {
            contains: query,
            mode: 'insensitive'
        },
        deletedAt: null,
        conversation: {
            participants: {
                some: {
                    userId,
                    leftAt: null
                }
            }
        }
    };

    if (conversationId) {
        whereClause.conversationId = conversationId;
    }

    const messages = await prisma.message.findMany({
        where: whereClause,
        include: {
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    avatar: true
                }
            },
            conversation: {
                select: {
                    id: true,
                    name: true,
                    isGroup: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip,
        take: limit
    });

    const total = await prisma.message.count({ where: whereClause });

    return {
        messages,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const searchConversations = async (userId, query, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: {
                    userId,
                    leftAt: null
                }
            },
            OR: [
                {
                    name: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    participants: {
                        some: {
                            user: {
                                fullName: {
                                    contains: query,
                                    mode: 'insensitive'
                                }
                            }
                        }
                    }
                }
            ]
        },
        include: {
            participants: {
                where: { leftAt: null },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                            isOnline: true
                        }
                    }
                }
            }
        },
        skip,
        take: limit
    });

    const total = await prisma.conversation.count({
        where: {
            participants: {
                some: {
                    userId,
                    leftAt: null
                }
            },
            name: {
                contains: query,
                mode: 'insensitive'
            }
        }
    });

    return {
        conversations,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export default {
    getConversations,
    getConversationById,
    createConversation,
    updateConversation,
    deleteConversation,
    addParticipants,
    removeParticipant,
    leaveConversation,
    updateParticipantRole,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    markConversationAsRead,
    searchMessages,
    searchConversations
};