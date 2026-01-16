
import friendServices from '../services/friendServices.js';
import { validateFriend } from '../dtos/friend.js';

const sendFriendRequest = async (req, res) => {
    try {
        const { error } = validateFriend(req.body);
        if (error) {
            return res.status(400).json({ message: error.details.map(detail => detail.message).join(', ') });
        }
        
        const { fromUserId, toUserId } = req.body;

        await friendServices.sendFriendRequest(fromUserId, toUserId);
        res.status(200).json({ message: 'Friend request sent' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;

        await friendServices.acceptFriendRequest(requestId);
        res.status(200).json({ message: 'Friend request accepted' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId, userId } = req.body;

        if (!requestId || !userId) {
            return res.status(400).json({ message: 'requestId and userId are required' });
        }

        await friendServices.rejectFriendRequest(requestId, userId);
        res.status(200).json({ message: 'Friend request rejected' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const cancelFriendRequest = async (req, res) => {
    try {
        const { requestId, userId } = req.body;

        if (!requestId || !userId) {
            return res.status(400).json({ message: 'requestId and userId are required' });
        }

        await friendServices.cancelFriendRequest(requestId, userId);
        res.status(200).json({ message: 'Friend request cancelled' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeFriend = async (req, res) => {
    try {
        const { userId, friendId } = req.body;

        if (!userId || !friendId) {
            return res.status(400).json({ message: 'userId and friendId are required' });
        }

        await friendServices.removeFriend(userId, friendId);
        res.status(200).json({ message: 'Friend removed' });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const blockFriend = async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        if (!userId || !friendId) {
            return res.status(400).json({ message: 'userId and friendId are required' });
        }

        await friendServices.blockFriend(userId, friendId);
        res.status(200).json({ message: 'Friend blocked' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const unblockFriend = async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        if (!userId || !friendId) {
            return res.status(400).json({ message: 'userId and friendId are required' });
        }

        await friendServices.unblockFriend(userId, friendId);
        res.status(200).json({ message: 'Friend unblocked' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFriendList = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const friends = await friendServices.getAllFriends(userId);
        res.status(200).json({ friends });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getIncomingRequests = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const requests = await friendServices.getIncomingRequests(userId);
        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getOutgoingRequests = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const requests = await friendServices.getOutgoingRequests(userId);
        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
    getOutgoingRequests
};