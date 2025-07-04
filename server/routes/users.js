import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    }).select('username email avatar bio isOnline lastSeen').limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username email avatar bio isOnline lastSeen createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Update fields
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;