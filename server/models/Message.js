import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'shared_post'],
    default: 'text'
  },
  conversationId: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Message', messageSchema);