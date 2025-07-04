import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Users, Settings, LogOut, Rocket } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { friendsAPI } from '../../lib/api';
import { disconnectSocket } from '../../lib/socket';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  activeTab: 'chat' | 'search' | 'requests' | 'profile' | 'community';
  setActiveTab: (tab: 'chat' | 'search' | 'requests' | 'profile' | 'community') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuthStore();
  const { conversations } = useChatStore();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const loadPendingRequests = async () => {
      try {
        const response = await friendsAPI.getReceivedRequests();
        setPendingRequestsCount(response.data.length);
      } catch (error) {
        console.error('Error loading pending requests:', error);
      }
    };

    loadPendingRequests();
  }, []);

  const handleLogout = async () => {
    try {
      disconnectSocket();
      logout();
      toast.success('You have left the dark side...');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const menuItems = [
    { id: 'community', icon: Rocket, label: 'Sith Network' },
    { id: 'chat', icon: MessageCircle, label: 'Transmissions', count: totalUnreadMessages },
    { id: 'search', icon: Search, label: 'Find Allies' },
    { id: 'requests', icon: Users, label: 'Alliance Requests', count: pendingRequestsCount },
    { id: 'profile', icon: Settings, label: 'Sith Profile' },
  ];

  return (
    <div className="w-80 bg-[#0d0d0d] border-r border-red-800 flex flex-col shadow-inner">
      {/* Header */}
      <div className="p-6 border-b border-red-800 bg-gradient-to-br from-[#1a1a1a] to-[#2a0000]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-700 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-400">{user?.username}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-red-500/50 shadow-sm"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 bg-[#0d0d0d]">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all 
                  ${isActive
                    ? 'bg-gradient-to-r from-red-600 to-red-950 text-orange-200 border border-red-600 shadow-md'
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-red-300'}`
                }
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-300' : 'text-gray-500'}`} />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.count && item.count > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-md">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <span className="p-28"></span>
      <div className="p-6 border-t border-red-800 bg-[#0d0d0d]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-900 hover:text-orange-200 transition-colors"
        >
          <LogOut className="w-8 h-8" />
          <span className="font-medium">Leave the Order</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;