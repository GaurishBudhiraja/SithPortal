import React, { useState, useEffect } from 'react';
import { Users, Check, X, Loader2, Clock } from 'lucide-react';
import { friendsAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  receiver: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
}

const FriendRequests: React.FC = () => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        friendsAPI.getReceivedRequests(),
        friendsAPI.getSentRequests()
      ]);
      
      setReceivedRequests(receivedResponse.data);
      setSentRequests(sentResponse.data);
    } catch (error) {
      console.error('Error loading alliance requests:', error);
      toast.error('Failed to load alliance requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      await friendsAPI.acceptFriendRequest(requestId);
      toast.success(`Accepted alliance request from ${senderName}`);
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string, senderName: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      await friendsAPI.rejectFriendRequest(requestId);
      toast.success(`Rejected alliance request from ${senderName}`);
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-red-900 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-900 rounded-lg sith-glow">
            <Users className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-red-400 sith-text-glow">Alliance Requests</h1>
            <p className="text-sm text-gray-500">Manage your pending alliance requests</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-red-900">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-600'
            }`}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-400 hover:border-gray-600'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-900">
        {activeTab === 'received' && (
          <div className="p-6">
            {receivedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Users className="w-12 h-12 mb-2 text-red-600" />
                <p>No pending alliance requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-gray-800 rounded-lg p-4 shadow-sm border border-red-900 sith-glow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
                          <span className="text-red-300 font-semibold">
                            {request.sender.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-400">{request.sender.username}</h3>
                          <p className="text-sm text-gray-500">{request.sender.email}</p>
                          {request.message && (
                            <p className="text-sm text-gray-400 mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request._id, request.sender.username)}
                          disabled={processingRequests.has(request._id)}
                          className="lightsaber-btn flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequests.has(request._id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id, request.sender.username)}
                          disabled={processingRequests.has(request._id)}
                          className="lightsaber-btn flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequests.has(request._id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="p-6">
            {sentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Clock className="w-12 h-12 mb-2 text-red-600" />
                <p>No sent alliance requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-gray-800 rounded-lg p-4 shadow-sm border border-red-900 sith-glow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center sith-glow">
                          <span className="text-red-300 font-semibold">
                            {request.receiver.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-400">{request.receiver.username}</h3>
                          <p className="text-sm text-gray-500">{request.receiver.email}</p>
                          {request.message && (
                            <p className="text-sm text-gray-400 mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Sent {formatDate(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-900 text-yellow-300 rounded-lg border border-yellow-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;