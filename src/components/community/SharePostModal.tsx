import React, { useState, useEffect } from 'react';
import { X, Share, Loader2, Users } from 'lucide-react';
import { friendsAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface SharePostModalProps {
  post: {
    _id: string;
    title: string;
    author: {
      username: string;
    };
  };
  onClose: () => void;
  onShare: (friendId: string) => void;
}

interface Friend {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

const SharePostModal: React.FC<SharePostModalProps> = ({ post, onClose, onShare }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const response = await friendsAPI.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Failed to load allies');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (friendId: string) => {
    setSharing(prev => new Set(prev).add(friendId));
    try {
      await onShare(friendId);
    } finally {
      setSharing(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-red-900 w-full max-w-md max-h-[80vh] overflow-hidden sith-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-900 rounded-lg sith-glow">
              <Share className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-red-400 sith-text-glow">Share Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b border-red-900 bg-gray-700">
          <h3 className="font-medium text-red-400 mb-1">"{post.title}"</h3>
          <p className="text-sm text-gray-400">by {post.author.username}</p>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Users className="w-8 h-8 mb-2 text-red-600" />
              <p className="text-sm">No allies to share with</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {friends.map((friend) => (
                <button
                  key={friend._id}
                  onClick={() => handleShare(friend._id)}
                  disabled={sharing.has(friend._id)}
                  className="lightsaber-btn w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
                      <span className="text-red-300 font-semibold text-sm">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {friend.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800 sith-glow"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-red-400">{friend.username}</h3>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                  {sharing.has(friend._id) ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  ) : (
                    <Share className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;