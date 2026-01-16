import express from 'express';
import friendController from '../controllers/friendController.js';

const router = express.Router();

// get friend list
router.get('/', friendController.getFriendList); // To be implemented

// get resquests incoming
router.get('/requests/incoming', friendController.getIncomingRequests);

// get requests outgoing
router.get('/requests/outgoing', friendController.getOutgoingRequests);

// send friend request
router.post('/request', friendController.sendFriendRequest);

// accept friend request
router.post('/accept', friendController.acceptFriendRequest); 

// reject friend request
router.post('/reject', friendController.rejectFriendRequest); 

// cancel friend request
router.post('/cancel', friendController.cancelFriendRequest); 

// detroys friend
router.post('/unfriend', friendController.removeFriend); 

// block friend
router.post('/block', friendController.blockFriend); 

// unblock friend
router.post('/unblock', friendController.unblockFriend); 

export default router;