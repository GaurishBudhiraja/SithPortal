import { create } from 'zustand';

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
  messageType: 'text' | 'image' | 'file';
  conversationId: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  friend: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  conversationId: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setUserTyping: (userId: string, conversationId: string) => void;
  removeUserTyping: (userId: string) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: new Map(),
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversationId) => set({ activeConversation: conversationId }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => {
    const { messages, activeConversation } = get();
    if (message.conversationId === activeConversation) {
      set({ messages: [...messages, message] });
    }
  },
  setUserOnline: (userId) => {
    const { onlineUsers } = get();
    const newOnlineUsers = new Set(onlineUsers);
    newOnlineUsers.add(userId);
    set({ onlineUsers: newOnlineUsers });
  },
  setUserOffline: (userId) => {
    const { onlineUsers } = get();
    const newOnlineUsers = new Set(onlineUsers);
    newOnlineUsers.delete(userId);
    set({ onlineUsers: newOnlineUsers });
  },
  setUserTyping: (userId, conversationId) => {
    const { typingUsers } = get();
    const newTypingUsers = new Map(typingUsers);
    newTypingUsers.set(userId, conversationId);
    set({ typingUsers: newTypingUsers });
  },
  removeUserTyping: (userId) => {
    const { typingUsers } = get();
    const newTypingUsers = new Map(typingUsers);
    newTypingUsers.delete(userId);
    set({ typingUsers: newTypingUsers });
  },
  updateConversationLastMessage: (conversationId, message) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv => 
      conv.conversationId === conversationId 
        ? { ...conv, lastMessage: message }
        : conv
    );
    set({ conversations: updatedConversations });
  },
}));