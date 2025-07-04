import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
    ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
    : null;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const usersAPI = {
  searchUsers: (query: string) => api.get(`/users/search?q=${query}`),
  getUserProfile: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

export const friendsAPI = {
  sendFriendRequest: (receiverId: string, message?: string) =>
    api.post('/friends/request', { receiverId, message }),
  getReceivedRequests: () => api.get('/friends/requests/received'),
  getSentRequests: () => api.get('/friends/requests/sent'),
  acceptFriendRequest: (requestId: string) =>
    api.post(`/friends/request/${requestId}/accept`),
  rejectFriendRequest: (requestId: string) =>
    api.post(`/friends/request/${requestId}/reject`),
  getFriends: () => api.get('/friends'),
  removeFriend: (friendId: string) => api.delete(`/friends/${friendId}`),
};

export const messagesAPI = {
  getConversationMessages: (friendId: string, page?: number) =>
    api.get(`/messages/conversation/${friendId}?page=${page || 1}`),
  sendMessage: (receiverId: string, content: string, messageType?: string) =>
    api.post('/messages/send', { receiverId, content, messageType }),
  getUnreadCount: () => api.get('/messages/unread'),
  getConversations: () => api.get('/messages/conversations'),
};

export const postsAPI = {
  getAllPosts: (page?: number) => api.get(`/posts?page=${page || 1}`),
  createPost: (title: string, content: string, imageUrl?: string) =>
    api.post('/posts', { title, content, imageUrl }),
  likePost: (postId: string) => api.post(`/posts/${postId}/like`),
  commentOnPost: (postId: string, content: string) =>
    api.post(`/posts/${postId}/comment`, { content }),
  sharePost: (postId: string, friendId: string) =>
    api.post(`/posts/${postId}/share`, { friendId }),
  getPost: (postId: string) => api.get(`/posts/${postId}`),
  deletePost: (postId: string) => api.delete(`/posts/${postId}`),
};

export default api;