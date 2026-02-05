
import friendServices from '../services/friendServices.js';
import { validateFriend } from '../dtos/friend.js';
import { successResponse, errorResponse, paginatedResponse } from '../helpers/responseHelper.js';
import { emitToUser } from '../services/socketHelperServices.js';

const sendFriendRequest = async (req, res) => {
    try {
        const { toUserId } = req.body;
        if (!toUserId) {
            return errorResponse(res, 400, 'toUserId is required');
        }
        const fromUserId = req.user.id; // Lấy từ access token

        const result = await friendServices.sendFriendRequest(fromUserId, toUserId);
        
        // Emit socket event đến người nhận
        emitToUser(toUserId, 'friend-request-received', {
            requestId: result.id,
            fromUserId: fromUserId,
            fromUserName: req.user.fullName || req.user.username,
            fromUserEmail: req.user.email,
            message: `${req.user.fullName || req.user.username} sent you a friend request`
        });
        
        return successResponse(res, 200, 'Friend request sent successfully', result);

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        
        console.log('Accept friend request - requestId:', requestId);
        
        if (!requestId) {
            return errorResponse(res, 400, 'requestId is required');
        }

        const result = await friendServices.acceptFriendRequest(requestId);
        
        // Emit socket event đến người gửi request
        emitToUser(result.senderId, 'friend-request-accepted', {
            requestId: requestId,
            acceptedBy: req.user.id,
            acceptedByName: req.user.fullName || req.user.username,
            message: `${req.user.fullName || req.user.username} accepted your friend request`
        });
        
        return successResponse(res, 200, 'Friend request accepted successfully', result);

    } catch (error) {
        console.error('Accept friend request error:', error);
        return errorResponse(res, 500, error.message);
    }
};

const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        if (!requestId) {
            return errorResponse(res, 400, 'requestId is required');
        }

        const userId = req.user.id; // Lấy từ access token
        const result = await friendServices.rejectFriendRequest(requestId, userId);
        
        // Emit socket event đến người gửi request
        emitToUser(result.senderId, 'friend-request-rejected', {
            requestId: requestId,
            rejectedBy: userId,
            rejectedByName: req.user.fullName || req.user.username,
            message: `${req.user.fullName || req.user.username} rejected your friend request`
        });
        
        return successResponse(res, 200, 'Friend request rejected successfully');

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const cancelFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        if (!requestId) {
            return errorResponse(res, 400, 'requestId is required');
        }

        const userId = req.user.id; // Lấy từ access token
        const result = await friendServices.cancelFriendRequest(requestId, userId);
        
        // Emit socket event đến người nhận
        emitToUser(result.receiverId, 'friend-request-cancelled', {
            requestId: requestId,
            cancelledBy: userId,
            cancelledByName: req.user.fullName || req.user.username,
            message: `${req.user.fullName || req.user.username} cancelled the friend request`
        });
        
        return successResponse(res, 200, 'Friend request cancelled successfully');

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.body;

        if (!friendId) {
            return errorResponse(res, 400, 'friendId is required');
        }

        const userId = req.user.id; // Lấy từ access token
        await friendServices.removeFriend(userId, friendId);
        
        // Emit socket event đến người bị remove
        emitToUser(friendId, 'friend-removed', {
            removedBy: userId,
            removedByName: req.user.fullName || req.user.username,
            message: `${req.user.fullName || req.user.username} removed you from friends`
        });
        
        return successResponse(res, 200, 'Friend removed successfully');

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const blockFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        if (!friendId) {
            return errorResponse(res, 400, 'friendId is required');
        }

        const userId = req.user.id; // Lấy từ access token
        await friendServices.blockFriend(userId, friendId);
        
        // Emit socket event đến người bị block
        emitToUser(friendId, 'friend-blocked', {
            blockedBy: userId,
            blockedByName: req.user.fullName || req.user.username,
            message: `You have been blocked by ${req.user.fullName || req.user.username}`
        });
        
        return successResponse(res, 200, 'Friend blocked successfully');
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const unblockFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        if (!friendId) {
            return errorResponse(res, 400, 'friendId is required');
        }

        const userId = req.user.id; // Lấy từ access token
        await friendServices.unblockFriend(userId, friendId);
        return successResponse(res, 200, 'Friend unblocked successfully');
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getFriendList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        let sortField = req.query.sort || 'createdAt';
        const sortOrder = req.query.order === 'desc' ? 'desc' : 'asc';
        const userId = req.user.id; // Lấy từ access token
        const name = req.query.name; // Lấy query parameter name

        const result = await friendServices.getFriendsList(userId, skip, limit, sortField, sortOrder, name);
        return paginatedResponse(res, 200, 'Friends retrieved successfully', result.data, {
            total: result.total,
            page: page,
            totalPages: result.totalPages,
            limit: result.limit
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getIncomingRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = req.user.id; // Lấy từ access token

        const result = await friendServices.getIncomingRequests(userId, skip, limit);
        return paginatedResponse(res, 200, 'Incoming requests retrieved successfully', result.data, {
            total: result.total,
            page: page,
            totalPages: result.totalPages,
            limit: result.limit
        });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getOutgoingRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = req.user.id; // Lấy từ access token

        const result = await friendServices.getOutgoingRequests(userId, skip, limit);
        return paginatedResponse(res, 200, 'Outgoing requests retrieved successfully', result.data, {
            total: result.total,
            page: page,
            totalPages: result.totalPages,
            limit: result.limit
        });
        
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getFriendshipStatus = async (req, res) => {
    try {
        const userId = req.user.id; // User đang logged in
        const targetUserId = req.params.userId; // User cần check

        if (!targetUserId) {
            return errorResponse(res, 400, 'userId is required');
        }

        const status = await friendServices.getFriendshipStatus(userId, targetUserId);
        return successResponse(res, 200, 'Friendship status retrieved successfully', status);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getPublicFriendsByName = async (req, res) => {
    try {
        const name = req.params.name;
        if (!name) {
            return errorResponse(res, 400, 'name is required');
        }

        const friends = await friendServices.getPublicFriendsByName(name);
        return successResponse(res, 200, 'Public friends retrieved successfully', friends);
    } catch (error) {
        return errorResponse(res, 500, error.message);
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
    getFriendList,
    getIncomingRequests,
    getOutgoingRequests,
    getFriendshipStatus,
    getPublicFriendsByName
};