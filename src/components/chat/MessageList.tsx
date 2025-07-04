import React, { useEffect, useRef } from 'react';
import { Loader2, Check, CheckCheck, ExternalLink } from 'lucide-react';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file' | 'shared_post';
  isRead: boolean;
  createdAt: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, loading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const renderSharedPost = (content: string) => {
    try {
      const postData = JSON.parse(content);
      return (
        <div className="shared-post-widget p-3 rounded-lg min-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <ExternalLink className="w-4 h-4 text-black-400" />
            <span className="text-xs text-grey-400 font-medium">Shared Post</span>
          </div>
          <h4 className="font-semibold text-red-300 text-xl mb-1">{postData.title}</h4>
          <p className="text-black text-sm mb-2 min-w-sm">{postData.content}</p>
          <p className="text-black text-sm">by {postData.author}</p>
          {postData.imageUrl && (
            <img 
              src={postData.imageUrl} 
              alt="Shared post" 
              className="w-full object-cover rounded mt-2 min-h-20"
            />
          )}
        </div>
      );
    } catch {
      return <p className="text-sm">{content}</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
      </div>
    );
  }

  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, dayMessages]) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-red-900 text-red-300 text-xs px-3 py-1 rounded-full sith-glow">
              {formatDate(date)}
            </div>
          </div>

          {/* Messages for this day */}
          {dayMessages.map((message, index) => {
            const isCurrentUser = message.sender._id === currentUserId;
            const prevMessage = index > 0 ? dayMessages[index - 1] : null;
            const showAvatar = !prevMessage || prevMessage.sender._id !== message.sender._id;
            
            return (
              <div
                key={message._id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                  showAvatar ? 'mt-4' : 'mt-1'
                }`}
              >
                {!isCurrentUser && showAvatar && (
                  <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mr-2 sith-glow">
                    <span className="text-red-300 font-semibold text-xs">
                      {message.sender.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {!isCurrentUser && !showAvatar && (
                  <div className="w-8 h-8 mr-2"></div>
                )}
                
                <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'ml-auto' : ''}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isCurrentUser
                        ? 'bg-red-600 text-white sith-glow'
                        : 'bg-gray-700 text-red-300 border border-red-800'
                    }`}
                  >
                    {message.messageType === 'shared_post' ? 
                      renderSharedPost(message.content) : 
                      <p className="text-sm">{message.content}</p>
                    }
                  </div>
                  
                  <div className={`flex items-center space-x-1 mt-1 ${isCurrentUser ? 'justify-end' : ''}`}>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </span>
                    {isCurrentUser && (
                      <div className="text-gray-500">
                        {message.isRead ? (
                          <CheckCheck className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;