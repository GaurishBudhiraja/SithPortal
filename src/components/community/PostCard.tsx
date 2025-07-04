import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { postsAPI, friendsAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import SharePostModal from './SharePostModal';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';


interface PostCardProps {
  post: {
    _id: string;
    author: {
      _id: string;
      username: string;
      email: string;
      avatar?: string;
    };
    title: string;
    content: string;
    imageUrl?: string;
    likes: Array<{
      user: string;
      createdAt: string;
    }>;
    comments: Array<{
      _id: string;
      user: {
        _id: string;
        username: string;
        avatar?: string;
      };
      content: string;
      createdAt: string;
    }>;
    shares: Array<{
      user: string;
      sharedTo: string;
      createdAt: string;
    }>;
    createdAt: string;
  };
  onLike: () => void;
  onCommentAdded: (comment: any) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onCommentAdded }) => {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const isLiked = post.likes.some(like => like.user === user?._id);
  const isOwnPost = post.author._id === user?._id;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const response = await postsAPI.commentOnPost(post._id, newComment.trim());
      onCommentAdded(response.data.comment);
      setNewComment('');
      toast.success('Comment added');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = async (friendId: string) => {
    try {
      await postsAPI.sharePost(post._id, friendId);
      toast.success('Post shared successfully');
      setShowShareModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to share post');
    }
  };

  const handleSendFriendRequest = async () => {
    setSendingRequest(true);
    try {
      await friendsAPI.sendFriendRequest(post.author._id, `Greetings ${post.author.username}, join my alliance!`);
      toast.success(`Alliance request sent to ${post.author.username}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send alliance request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="post-card bg-gray-800 rounded-xl overflow-hidden post-enter">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
              <span className="text-red-300 font-semibold text-sm">
                {post.author.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-red-400">{post.author.username}</h3>
                {!isOwnPost && (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={sendingRequest}
                    className="lightsaber-btn flex items-center space-x-1 px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{sendingRequest ? 'Sending...' : 'Add Ally'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-400 mb-3 sith-text-glow">{post.title}</h2>
        <p className="text-gray-300 whitespace-pre-wrap mb-4 leading-relaxed">{post.content}</p>
        
        {post.imageUrl && (
          <div className="mb-4">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full rounded-lg border border-red-800 min-h-96 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6">
            {/*CHANGED BUTTON HERE*/}
            <button
              onClick={onLike}
              className="flex items-center space-x-2 transition-colors hover:scale-105 transform transition-transform duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill={isLiked ? '#3B82F6' : 'none'}
                stroke={isLiked ? '#3B82F6' : '#9CA3AF'}
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                />
              </svg>
              <span
                className={`text-sm font-medium transition-colors ${
                  isLiked ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                {post.likes.length}
              </span>
            </button>

            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments.length}</span>
            </button>
            
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">{post.shares.length}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4">
            {/* Existing Comments */}
            {post.comments.map((comment) => (
              <div key={comment._id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
                  <span className="text-red-300 font-semibold text-xs">
                    {comment.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 bg-gray-700 rounded-lg p-3 border border-red-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-red-400">{comment.user.username}</span>
                    <span className="text-xs text-gray-500">{formatTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.content}</p>
                </div>
              </div>
            ))}

            {/* Add Comment */}
            <form onSubmit={handleComment} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
                <span className="text-red-300 font-semibold text-xs">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-red-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-300 placeholder-gray-500 text-sm"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || commentLoading}
                  className="lightsaber-btn p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <SharePostModal
          post={post}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
        />
      )}
    </div>
  );
};

export default PostCard;