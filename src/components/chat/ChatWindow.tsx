import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Smile, Paperclip, Phone, Video, Info } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { messagesAPI } from '../../lib/api';
import { socket } from '../../lib/socket';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import { toast } from 'react-hot-toast';

const ChatWindow: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    setMessages, 
    addMessage, 
    updateConversationLastMessage 
  } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const activeConversationData = conversations.find(
    conv => conv.conversationId === activeConversation
  );

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      socket.emit('join_conversation', activeConversation);
    }
  }, [activeConversation]);

  const loadMessages = async () => {
    if (!activeConversation) return;
    
    setLoading(true);
    try {
      const friendId = activeConversationData?.friend._id;
      if (friendId) {
        const response = await messagesAPI.getConversationMessages(friendId);
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load transmissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation || !activeConversationData) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await messagesAPI.sendMessage(
        activeConversationData.friend._id,
        messageContent
      );
      
      const message = response.data;
      addMessage(message);
      updateConversationLastMessage(activeConversation, message);
      
      // Emit message to other user
      socket.emit('send_message', {
        ...message,
        conversationId: activeConversation
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send transmission');
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Emit typing indicator
    if (!isTyping && activeConversation) {
      setIsTyping(true);
      socket.emit('typing', {
        conversationId: activeConversation,
        isTyping: true
      });
    }
    
    // Clear typing indicator after 1 second of no typing
    setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          conversationId: activeConversation,
          isTyping: false
        });
      }
    }, 1000);
  };

  const formatLastSeen = (lastSeen: string, isOnline: boolean) => {
    if (isOnline) return 'Online';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return 'Long ago';
  };

  if (!activeConversation) {
    return (
      <div className="flex h-full">
        <ConversationList />
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 border-l border-red-900">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4 sith-glow">
              <MessageCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-red-400 mb-2 sith-text-glow">
              Select a transmission
            </h2>
            <p className="text-gray-500">
              Choose an ally to begin communication
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="flex h-full">
    <ConversationList />

    <div className="flex-1 flex flex-col border-l border-red-900 bg-gray-950">
      {/* Chat Header */}
      <div className="bg-gray-900 border-b border-red-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {activeConversationData?.friend.avatar ? (
                <img 
                  src={activeConversationData.friend.avatar} 
                  alt={activeConversationData.friend.username}
                  className="w-11 h-11 rounded-full object-cover border-2 border-red-600 shadow-md sith-glow"
                />
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-red-700 to-red-900 rounded-full flex items-center justify-center shadow-md sith-glow">
                  <span className="text-red-300 font-bold text-lg">
                    {activeConversationData?.friend.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                activeConversationData?.friend.isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`} />
            </div>
            <div>
              <h2 className="font-semibold text-red-400 sith-text-glow text-lg">
                {activeConversationData?.friend.username}
              </h2>
              <p className="text-xs text-gray-400">
                {activeConversationData && formatLastSeen(activeConversationData.friend.lastSeen, activeConversationData.friend.isOnline)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-red-500 hover:text-red-300 hover:bg-gray-800 rounded-lg transition">
              <Phone className="w-5 h-5 text-blue-400" />
            </button>
            <button className="p-2 text-red-500 hover:text-red-300 hover:bg-gray-800 rounded-lg transition">
              <Video className="w-5 h-5 text-green-400" />
            </button>
            <button className="p-2 text-red-500 hover:text-red-300 hover:bg-gray-800 rounded-lg transition">
              <Info className="w-5 h-5 text-blue" />
            </button>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-950">
        <MessageList messages={messages} currentUserId={user?._id} loading={loading} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-900 border-t border-red-900 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-red-500 hover:text-red-300 hover:bg-gray-800 rounded-lg transition"
          >
            <Paperclip className="w-5 h-5 text-green-300" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Send a transmission..."
              className="w-full px-4 py-2 pr-12 border border-red-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-red-300 placeholder-gray-500 shadow-inner"
              maxLength={1000}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:text-red-300 transition"
            >
              <Smile className="w-5 h-5 text-blue-500" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition sith-glow"
          >
            <Send className="w-7 h-5 text-orange-400 " />
          </button>
        </form>
      </div>
    </div>
  </div>
);

};

export default ChatWindow;