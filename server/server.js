import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import friendRoutes from './routes/friends.js';
import postRoutes from './routes/posts.js';
import User from './models/User.js';

import path from 'path';


// Serve uploads folder

dotenv.config();

const app = express();

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Connect to MongoDB with error handling
const connectToMongoDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://abhinavakasavajhala:qa%5E6WigL8Gah9S%29s@cluster0.rkwxa.mongodb.net/SithAppFinalRecording';
    if (!mongoURI) {
      console.error("❌ MONGO_URI not found in .env");
      process.exit(1);
    }
    else console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Stop server if DB fails
  }
};


connectToMongoDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/posts', postRoutes);

// .io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_connected', async (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    
    // Update user online status in database
    try {
      await User.findByIdAndUpdate(userId, { 
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
    
    // Broadcast online status
    socket.broadcast.emit('user_online', userId);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send_message', (data) => {
    socket.to(data.conversationId).emit('receive_message', data);
  });

  socket.on('friend_request_sent', (data) => {
    const receiverSocketId = connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('friend_request_received', data);
    }
  });

  socket.on('friend_request_accepted', (data) => {
    const senderSocketId = connectedUsers.get(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('friend_request_accepted', data);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user_typing', {
      userId: socket.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('new_post', (data) => {
    socket.broadcast.emit('post_created', data);
  });

  socket.on('post_liked', (data) => {
    socket.broadcast.emit('post_updated', data);
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Update user offline status in database
      try {
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }
      
      socket.broadcast.emit('user_offline', socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});