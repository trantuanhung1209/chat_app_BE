import { prisma } from "../config/db.js";
import logger from '../config/logger.js';

const sendFriendRequest = async (fromUserId, toUserId) => {
    if (fromUserId === toUserId) {
        logger.error('send_friend_request_failed', {
            msg: 'Cannot send friend request to yourself',
            fromUserId,
            toUserId,
            status_code: 400
        });
        throw new Error("Cannot send friend request to yourself.");
    }

    // check if either user has blocked the other
    const blocked = await prisma.friendRequest.findFirst({
        where: {
            OR: [
                { senderId: fromUserId, receiverId: toUserId, status: 'blocked' },
                { senderId: toUserId, receiverId: fromUserId, status: 'blocked' }
            ]
        }
    });
    if (blocked) {
        logger.error('send_friend_request_failed', {
            msg: 'Blocked relationship',
            fromUserId,
            toUserId,
            status_code: 400
        });
        throw new Error("Cannot send friend request. One of the users has blocked the other.");
    }

    // check if a friend request already exists or they are already friends
    const existingRequest = await prisma.friendRequest.findFirst({
        where: {
            OR: [
                { senderId: fromUserId, receiverId: toUserId },
                { senderId: toUserId, receiverId: fromUserId }
            ],
            status: { in: ['pending', 'accepted'] }
        }
    });
    if (existingRequest) {
        logger.error('send_friend_request_failed', {
            msg: 'Friend request already exists or already friends',
            fromUserId,
            toUserId,
            status_code: 400
        });
        throw new Error("Friend request already exists or you are already friends.");
    }

    // create new friend request
    try {
        const request = await prisma.friendRequest.create({
            data: {
                senderId: fromUserId,
                receiverId: toUserId,
                status: 'pending'
            }
        });
        logger.info('send_friend_request_success', {
            fromUserId,
            toUserId,
            requestId: request.id,
            status_code: 201
        });
        return request;
    } catch (error) {
        logger.error('send_friend_request_failed', {
            fromUserId,
            toUserId,
            status_code: 500,
            error: { name: error.name, message: error.message }
        });
        throw new Error("Error sending friend request: " + error.message);
    }
};

const acceptFriendRequest = async (requestId) => {
    try {
        const request = await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'accepted' }
        });
        return request;
    } catch (error) {
        logger.error('accept_friend_request_failed', {
            requestId,
            status_code: 500,
            error: { name: error.name, message: error.message }
        });
        throw new Error("Error accepting friend request: " + error.message);
    }
};

const rejectFriendRequest = async (requestId, userId) => {
    const request = await prisma.friendRequest.findUnique({
        where: { id: requestId }
    });

    if (!request) {
        throw new Error("Friend request not found.");
    }

    if (request.receiverId !== userId) {
        throw new Error("Only the receiver can reject the friend request.");
    }

    if (request.status !== 'pending') {
        throw new Error("Can only reject pending friend requests.");
    }

    try {
        return await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'rejected' }
        });
    } catch (error) {
        throw new Error("Error rejecting friend request: " + error.message);
    }  
};

const cancelFriendRequest = async (requestId, userId) => {
    const request = await prisma.friendRequest.findUnique({
        where: { id: requestId }
    });

    if (!request) {
        throw new Error("Friend request not found.");
    }

    if (request.senderId !== userId) {
        throw new Error("Only the sender can cancel the friend request.");
    }

    if (request.status !== 'pending') {
        throw new Error("Can only cancel pending friend requests.");
    }

    try {
        return await prisma.friendRequest.delete({
            where: { id: requestId }
        });
    } catch (error) {
        throw new Error("Error cancelling friend request: " + error.message);
    }
};

const removeFriend = async (userId, friendId) => {
    try {
        const friendship = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId, status: 'accepted' },
                    { senderId: friendId, receiverId: userId, status: 'accepted' }
                ]
            }
        });

        if (!friendship) {
            throw new Error("Friendship not found.");
        }

        return await prisma.friendRequest.delete({
            where: { id: friendship.id }
        });
    } catch (error) {
        throw new Error("Error removing friend: " + error.message);
    }
};

const blockFriend = async (userId, friendId) => {
    try {
        // First, remove any existing friendship or pending requests
        await prisma.friendRequest.deleteMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: friendId },
                    { senderId: friendId, receiverId: userId }
                ]
            }
        });

        // Then, create a block entry
        return await prisma.friendRequest.create({
            data: {
                senderId: userId,
                receiverId: friendId,
                status: 'blocked'
            }
        });
    } catch (error) {
        throw new Error("Error blocking friend: " + error.message);
    }
};

const unblockFriend = async (userId, friendId) => {
    try {
        const blockEntry = await prisma.friendRequest.findFirst({
            where: {
                senderId: userId,
                receiverId: friendId,
                status: 'blocked'
            }
        });

        if (!blockEntry) {
            throw new Error("Block entry not found.");
        }

        return await prisma.friendRequest.delete({
            where: { id: blockEntry.id }
        });
    } catch (error) {
        throw new Error("Error unblocking friend: " + error.message);
    }
};

const getFriendsList = async (userId, skip, limit, sortField = 'createdAt', sortOrder = 'asc', name = null) => {
    try {
        const friends = await prisma.friendRequest.findMany({
            where: {
                OR: [
                    { senderId: userId, status: 'accepted' },
                    { receiverId: userId, status: 'accepted' }
                ]
            }, 
            skip,
            take: limit, 
            orderBy: {
                [sortField]: sortOrder
            }
        });

        const friendIds = friends.map(fr => (fr.senderId === userId ? fr.receiverId : fr.senderId));

        // count total friends
        const totalFriends = await prisma.friendRequest.count({
            where: {
                OR: [
                    { senderId: userId, status: 'accepted' },
                    { receiverId: userId, status: 'accepted' }
                ]
            }
        });

        // Build where clause cho user query
        const userWhereClause = {
            id: { in: friendIds }
        };

        // Nếu có name query, thêm điều kiện tìm kiếm
        if (name) {
            userWhereClause.OR = [
                { fullName: { contains: name, mode: 'insensitive' } },
                { email: { contains: name, mode: 'insensitive' } }
            ];
        }

        const users = await prisma.user.findMany({
            where: userWhereClause,
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        });

        // Count total với filter
        const filteredTotal = users.length;

        return {
            data: users,
            total: filteredTotal,
            totalPages: Math.ceil(filteredTotal / limit),
            limit,
            skip
        };
    } catch (error) {
        throw new Error("Error fetching friend list: " + error.message);
    }
};

const getIncomingRequests = async (userId, skip = 0, limit = 10) => {
    try {
        const requests = await prisma.friendRequest.findMany({
            where: {
                receiverId: userId,
                status: 'pending'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        createdAt: true
                    }
                }
            },
            skip,
            take: limit
        });

        const total = await prisma.friendRequest.count({
            where: {
                receiverId: userId,
                status: 'pending'
            }
        });

        return {
            data: requests.map(req => ({
                requestId: req.id,
                sender: req.sender,
            })),
            total,
            totalPages: Math.ceil(total / limit),
            limit,
            skip
        };
    } catch (error) {
        throw new Error("Error fetching incoming requests: " + error.message);
    }
};

const getOutgoingRequests = async (userId, skip = 0, limit = 10) => {
    try {
        const requests = await prisma.friendRequest.findMany({
            where: {
                senderId: userId,
                status: 'pending'
            },
            include: {
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatar: true,
                        createdAt: true
                    }
                }
            },
            skip,
            take: limit
        });

        const total = await prisma.friendRequest.count({
            where: {
                senderId: userId,
                status: 'pending'
            }
        });

        return {
            data: requests.map(req => ({
                requestId: req.id,
                receiver: req.receiver,
            })),
            total,
            totalPages: Math.ceil(total / limit),
            limit,
            skip
        };
    } catch (error) {
        throw new Error("Error fetching outgoing requests: " + error.message);
    }
};

const getFriendshipStatus = async (userId, targetUserId) => {
    try {
        // Kiểm tra quan hệ giữa 2 user
        const relationship = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: userId }
                ]
            }
        });

        if (!relationship) {
            return { status: 'none', message: 'No relationship' };
        }

        if (relationship.status === 'accepted') {
            return { status: 'friends', message: 'Already friends' };
        }

        if (relationship.status === 'blocked') {
            if (relationship.senderId === userId) {
                return { status: 'blocked_by_me', message: 'You blocked this user' };
            } else {
                return { status: 'blocked_by_them', message: 'This user blocked you' };
            }
        }

        if (relationship.status === 'pending') {
            if (relationship.senderId === userId) {
                return { status: 'pending_sent', message: 'Friend request sent', requestId: relationship.id };
            } else {
                return { status: 'pending_received', message: 'Friend request received', requestId: relationship.id };
            }
        }

        return { status: 'unknown', message: 'Unknown status' };
    } catch (error) {
        throw new Error("Error checking friendship status: " + error.message);
    }
};

const getPublicFriendsByName = async (name) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                fullName: {
                    contains: name,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        }); 
        return users;
    } catch (error) {
        throw new Error("Error fetching public friends by name: " + error.message);
    }
};

export default {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockFriend,
    unblockFriend,
    getFriendsList,
    getIncomingRequests,
    getOutgoingRequests,
    getFriendshipStatus,
    getPublicFriendsByName
};
