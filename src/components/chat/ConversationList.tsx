import React from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

const ConversationList: React.FC = () => {
  const { conversations, activeConversation, setActiveConversation } = useChatStore();

  const formatLastMessage = (content: string, messageType: string) => {
    if (messageType === 'shared_post') {
      try {
        const postData = JSON.parse(content);
        return `🚀 Shared: "${postData.title}"`;
      } catch {
        return '🚀 Shared a post';
      }
    }
    
    if (content.length > 50) {
      return content.substring(0, 50) + '...';
    }
    return content;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
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

  return (
    <div className="w-80 bg-gray-800 border-r border-red-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-red-900">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-900 rounded-lg sith-glow">
            <MessageCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-red-400 sith-text-glow">Transmissions</h2>
            <p className="text-sm text-gray-500">{conversations.length} active</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-red-900">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-red-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-red-800 rounded-lg leading-5 bg-gray-700 placeholder-gray-500 text-red-300 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Search transmissions..."
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <MessageCircle className="w-8 h-8 mb-2 text-red-600" />
            <p className="text-sm">No transmissions yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.conversationId}
                onClick={() => setActiveConversation(conversation.conversationId)}
                className={`lightsaber-btn w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors ${
                  activeConversation === conversation.conversationId ? 'bg-orange-900 border border-red-700 sith-glow' : ''
                }`}
              >
                <div className="relative">
                  {conversation.friend.avatar ? (
                    <img 
                      src={conversation.friend.avatar} 
                      alt={conversation.friend.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-red-600 sith-glow"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
                      <span className="text-red-300 font-semibold">
                        {conversation.friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                    conversation.friend.isOnline ? 'status-online' : 'status-offline'
                  }`}></div>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-red-400">{conversation.friend.username}</h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-start">
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage 
                          ? formatLastMessage(conversation.lastMessage.content, conversation.lastMessage.messageType || 'text')
                          : 'No transmissions yet'
                        }
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatLastSeen(conversation.friend.lastSeen, conversation.friend.isOnline)}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center sith-glow">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;