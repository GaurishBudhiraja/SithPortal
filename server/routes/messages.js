import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get conversation messages
router.get('/conversation/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Create conversation ID (consistent ordering)
    const conversationId = [req.userId, friendId].sort().join('_');

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: req.userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text' } = req.body;

    // Verify receiver exists and is a friend
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sender = await User.findById(req.userId);
    if (!sender.friends.includes(receiverId)) {
      return res.status(403).json({ message: 'Can only send messages to friends' });
    }

    // Create conversation ID
    const conversationId = [req.userId, receiverId].sort().join('_');

    // Create message
    const message = new Message({
      sender: req.userId,
      receiver: receiverId,
      content,
      messageType,
      conversationId
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread message count
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.userId,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get conversations with last message
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friends', 'username email avatar isOnline lastSeen');
    
    const conversations = await Promise.all(
      user.friends.map(async (friend) => {
        const conversationId = [req.userId, friend._id].sort().join('_');
        
        const lastMessage = await Message.findOne({ conversationId })
          .sort({ createdAt: -1 })
          .populate('sender', 'username');

        const unreadCount = await Message.countDocuments({
          conversationId,
          receiver: req.userId,
          isRead: false
        });

        return {
          friend,
          lastMessage,
          unreadCount,
          conversationId
        };
      })
    );

    // Sort by last message timestamp
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;