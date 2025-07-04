import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get all public posts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const posts = await Post.find({ isPublic: true })
      .populate('author', 'username email avatar')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Create a new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    if (!imageUrl || !imageUrl.startsWith('https://res.cloudinary.com')) {
      return res.status(400).json({ message: 'Image must be uploaded to Cloudinary first.' });
    }

    const post = new Post({
      author: req.userId,
      title,
      content,
      imageUrl // already a secure Cloudinary link
    });

    await post.save();
    await post.populate('author', 'username email avatar');

    res.status(201).json({
      message: 'Post launched successfully',
      post
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Like/unlike a post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = post.likes.find(like => like.user.toString() === req.userId);
    
    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(like => like.user.toString() !== req.userId);
    } else {
      // Like
      post.likes.push({ user: req.userId });
    }

    await post.save();
    
    res.json({
      message: existingLike ? 'Post unliked' : 'Post liked',
      likesCount: post.likes.length,
      isLiked: !existingLike
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to post
router.post('/:postId/comment', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.userId,
      content: content.trim()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment
    await post.populate('comments.user', 'username avatar');
    
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share post to friend
router.post('/:postId/share', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;
    
    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required' });
    }

    const post = await Post.findById(req.params.postId).populate('author', 'username');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if friend exists and is actually a friend
    const sender = await User.findById(req.userId);
    if (!sender.friends.includes(friendId)) {
      return res.status(403).json({ message: 'Can only share posts with friends' });
    }

    // Create conversation ID
    const conversationId = [req.userId, friendId].sort().join('_');

    // Create a shared post widget message
    const postWidget = {
      type: 'shared_post',
      title: post.title,
      content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      author: post.author.username,
      imageUrl: post.imageUrl,
      postId: post._id
    };

    const shareMessage = new Message({
      sender: req.userId,
      receiver: friendId,
      content: JSON.stringify(postWidget),
      messageType: 'shared_post',
      conversationId
    });

    await shareMessage.save();

    // Add to post shares
    post.shares.push({
      user: req.userId,
      sharedTo: friendId
    });

    await post.save();

    res.json({
      message: 'Post shared successfully',
      sharesCount: post.shares.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get post by ID
router.get('/:postId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'username email avatar')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete post
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;