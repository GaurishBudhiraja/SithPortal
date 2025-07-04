import express from 'express';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send friend request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (receiverId === req.userId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    const sender = await User.findById(req.userId);
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Check if friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: req.userId, receiver: receiverId },
        { sender: receiverId, receiver: req.userId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      sender: req.userId,
      receiver: receiverId,
      message
    });

    await friendRequest.save();

    // Populate sender info
    await friendRequest.populate('sender', 'username email avatar');

    res.status(201).json({
      message: 'Friend request sent successfully',
      friendRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friend requests (received)
router.get('/requests/received', authenticateToken, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.userId,
      status: 'pending'
    }).populate('sender', 'username email avatar bio');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friend requests (sent)
router.get('/requests/sent', authenticateToken, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.userId,
      status: 'pending'
    }).populate('receiver', 'username email avatar bio');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept friend request
router.post('/request/:requestId/accept', authenticateToken, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.receiver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    // Update friend request status
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Add each other as friends
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.receiver }
    });

    await User.findByIdAndUpdate(friendRequest.receiver, {
      $addToSet: { friends: friendRequest.sender }
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject friend request
router.post('/request/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.receiver.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    // Update friend request status
    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get friends list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username email avatar bio isOnline lastSeen');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove friend
router.delete('/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;

    // Remove friend from both users' friends lists
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.userId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;