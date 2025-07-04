import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { usersAPI, friendsAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
}

const UserSearch: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  const { register, handleSubmit, watch } = useForm<{ query: string }>();
  const query = watch('query');

  useEffect(() => {
    const searchUsers = async () => {
      if (!query || query.trim().length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await usersAPI.searchUsers(query.trim());
        setUsers(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Error searching for allies');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSendFriendRequest = async (userId: string, username: string) => {
    setSendingRequests(prev => new Set(prev).add(userId));
    
    try {
      await friendsAPI.sendFriendRequest(userId, `Greetings ${username}, join my alliance!`);
      toast.success(`Alliance request sent to ${username}`);
      
      // Remove user from search results
      setUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send alliance request');
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-red-900 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-900 rounded-lg sith-glow">
            <Search className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-red-400 sith-text-glow">Find Allies</h1>
            <p className="text-sm text-gray-500">Search for potential Sith allies</p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-gray-800 border-b border-red-900 p-6">
        <form onSubmit={handleSubmit(() => {})}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-red-600" />
            </div>
            <input
              {...register('query')}
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-red-800 rounded-lg leading-5 bg-gray-700 placeholder-gray-500 text-red-300 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all"
              placeholder="Search by Sith name or email..."
              autoComplete="off"
            />
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto bg-gray-900">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-red-600" />
          </div>
        )}

        {!loading && query && query.trim().length >= 2 && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Users className="w-12 h-12 mb-2 text-red-600" />
            <p>No allies found matching "{query}"</p>
          </div>
        )}

        {!loading && (!query || query.trim().length < 2) && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Search className="w-12 h-12 mb-2 text-red-600" />
            <p>Start typing to search for allies</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="p-6 space-y-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-gray-800 rounded-lg p-4 shadow-sm border border-red-900 hover:shadow-md transition-shadow sith-glow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
                        <span className="text-red-300 font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-800 sith-glow"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-400">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.bio && (
                        <p className="text-sm text-gray-400 mt-1">{user.bio}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {user.isOnline ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendFriendRequest(user._id, user.username)}
                    disabled={sendingRequests.has(user._id)}
                    className="lightsaber-btn flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sith-glow"
                  >
                    {sendingRequests.has(user._id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>
                      {sendingRequests.has(user._id) ? 'Sending...' : 'Add Ally'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;