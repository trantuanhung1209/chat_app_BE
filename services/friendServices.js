import { prisma } from "../config/db.js";

const sendFriendRequest = async (fromUserId, toUserId) => {
    if (fromUserId === toUserId) {
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
        throw new Error("Friend request already exists or you are already friends.");
    }

    // create new friend request
    try {
        return await prisma.friendRequest.create({
            data: {
                senderId: fromUserId,
                receiverId: toUserId,
                status: 'pending'
            }
        });
    } catch (error) {
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

const getAllFriends = async (userId) => {
    try {
        const friends = await prisma.friendRequest.findMany({
            where: {
                OR: [
                    { senderId: userId, status: 'accepted' },
                    { receiverId: userId, status: 'accepted' }
                ]
            }
        });

        const friendIds = friends.map(fr => (fr.senderId === userId ? fr.receiverId : fr.senderId));

        return await prisma.user.findMany({
            where: { id: { in: friendIds } },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        });
    } catch (error) {
        throw new Error("Error fetching friend list: " + error.message);
    }
};

const getIncomingRequests = async (userId) => {
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
            }
        });

        return requests.map(req => ({
            requestId: req.id,
            sender: req.sender
        }));
    } catch (error) {
        throw new Error("Error fetching incoming requests: " + error.message);
    }
};

const getOutgoingRequests = async (userId) => {
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
            }
        });

        return requests.map(req => ({
            requestId: req.id,
            receiver: req.receiver
        }));
    } catch (error) {
        throw new Error("Error fetching outgoing requests: " + error.message);
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
    getAllFriends,
    getIncomingRequests,
    getOutgoingRequests
};
