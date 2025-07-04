import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { socket } from '../lib/socket';
import { messagesAPI } from '../lib/api';
import Sidebar from './layout/Sidebar';
import ChatWindow from './chat/ChatWindow';
import UserSearch from './users/UserSearch';
import FriendRequests from './friends/FriendRequests';
import ProfileSettings from './profile/ProfileSettings';
import CommunityFeed from './community/CommunityFeed';
import { toast } from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'requests' | 'profile' | 'community'>('community');
  const { user } = useAuthStore();
  const { 
    setConversations, 
    setUserOnline, 
    setUserOffline, 
    addMessage, 
    setUserTyping, 
    removeUserTyping 
  } = useChatStore();

  useEffect(() => {
    // Load conversations
    const loadConversations = async () => {
      try {
        const response = await messagesAPI.getConversations();
        setConversations(response.data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();

    // Socket event listeners
    socket.on('user_online', (userId: string) => {
      setUserOnline(userId);
    });

    socket.on('user_offline', (userId: string) => {
      setUserOffline(userId);
    });

    socket.on('receive_message', (message: any) => {
      addMessage(message);
      toast.success(`New transmission from ${message.sender.username}`);
    });

    socket.on('friend_request_received', (data: any) => {
      toast.success(`Alliance request from ${data.sender.username}`);
    });

    socket.on('friend_request_accepted', (data: any) => {
      toast.success(`${data.receiver.username} has joined your alliance!`);
      loadConversations(); // Refresh conversations
    });

    socket.on('user_typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (isTyping) {
        setUserTyping(userId, 'current-conversation');
      } else {
        removeUserTyping(userId);
      }
    });

    socket.on('post_created', (data: any) => {
      toast.success(`New post launched by ${data.author.username}`);
    });

    return () => {
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('receive_message');
      socket.off('friend_request_received');
      socket.off('friend_request_accepted');
      socket.off('user_typing');
      socket.off('post_created');
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'community':
        return <CommunityFeed />;
      case 'chat':
        return <ChatWindow />;
      case 'search':
        return <UserSearch />;
      case 'requests':
        return <FriendRequests />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <CommunityFeed />;
    }
  };

  return (
  <div className="flex h-screen overflow-hidden bg-black">
    {/* Sidebar column */}
    <div className="w-80 h-full overflow-y-auto">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>

    {/* Main content with scroll */}
    <main className="flex-1 h-full overflow-y-auto bg-[url('/stars-bg.png')] bg-cover bg-fixed text-white">
      {renderContent()}
    </main>
  </div>
);

};

export default Dashboard;