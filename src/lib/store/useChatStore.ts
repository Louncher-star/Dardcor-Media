import { create } from 'zustand';
import { Chat, Message, MessageReaction } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messages: { [chatId: string]: Message[] };
  onlineUserIds: string[];
  typingUsers: { [chatId: string]: { [userId: string]: string } };
  replyingToMessage: Message | null;
  searchQuery: string;
  chatFilter: 'all' | 'unread' | 'favorites' | 'groups';
  theme: 'dark' | 'light';
  isMobileSidebarOpen: boolean;

  // Actions
  setMobileSidebarOpen: (open: boolean) => void;
  setActiveChatId: (chatId: string | null) => void;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string, forAll?: boolean) => void;
  addReaction: (chatId: string, reaction: MessageReaction) => void;
  removeReaction: (chatId: string, messageId: string, userId: string) => void;
  setOnlineUserIds: (ids: string[]) => void;
  setUserTyping: (chatId: string, userId: string, name: string, isTyping: boolean) => void;
  setReplyingToMessage: (message: Message | null) => void;
  setSearchQuery: (query: string) => void;
  setChatFilter: (filter: 'all' | 'unread' | 'favorites' | 'groups') => void;
  toggleTheme: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  onlineUserIds: [],
  typingUsers: {},
  replyingToMessage: null,
  searchQuery: '',
  chatFilter: 'all',
  theme: 'dark', // Default ke tema gelap otentik WhatsApp Web
  isMobileSidebarOpen: false,

  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),

  setActiveChatId: (activeChatId) => {
    set({ activeChatId, replyingToMessage: null });
    // Reset unread count untuk chat aktif
    if (activeChatId) {
      const { chats } = get();
      set({
        chats: chats.map((c) => (c.id === activeChatId ? { ...c, unread_count: 0 } : c)),
      });
    }
  },

  setChats: (chats) => set({ chats }),

  addChat: (chat) =>
    set((state) => {
      const exists = state.chats.some((c) => c.id === chat.id);
      if (exists) return state;
      return { chats: [chat, ...state.chats] };
    }),

  updateChat: (chatId, updates) =>
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? { ...c, ...updates } : c)),
    })),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const chatMessages = state.messages[message.chat_id] || [];
      const exists = chatMessages.some((m) => m.id === message.id);
      const newMessages = exists
        ? chatMessages.map((m) => (m.id === message.id ? message : m))
        : [...chatMessages, message];

      // Update last_message dan urutan chats
      const updatedChats = state.chats.map((c) => {
        if (c.id === message.chat_id) {
          const isNotActive = state.activeChatId !== message.chat_id;
          return {
            ...c,
            last_message: message,
            last_message_at: message.created_at,
            unread_count: isNotActive ? (c.unread_count || 0) + 1 : 0,
          };
        }
        return c;
      });

      // Sort chats berdasarkan pesan terbaru
      updatedChats.sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      return {
        messages: {
          ...state.messages,
          [message.chat_id]: newMessages,
        },
        chats: updatedChats,
      };
    }),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
        },
      };
    }),

  deleteMessage: (chatId, messageId, forAll = false) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      if (forAll) {
        return {
          messages: {
            ...state.messages,
            [chatId]: chatMessages.map((m) =>
              m.id === messageId
                ? { ...m, is_deleted_for_all: true, content: 'Pesan ini telah dihapus.' }
                : m
            ),
          },
        };
      } else {
        return {
          messages: {
            ...state.messages,
            [chatId]: chatMessages.filter((m) => m.id !== messageId),
          },
        };
      }
    }),

  addReaction: (chatId, reaction) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((m) => {
            if (m.id === reaction.message_id) {
              const reactions = m.reactions || [];
              const filtered = reactions.filter((r) => r.user_id !== reaction.user_id);
              return { ...m, reactions: [...filtered, reaction] };
            }
            return m;
          }),
        },
      };
    }),

  removeReaction: (chatId, messageId, userId) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((m) => {
            if (m.id === messageId && m.reactions) {
              return {
                ...m,
                reactions: m.reactions.filter((r) => r.user_id !== userId),
              };
            }
            return m;
          }),
        },
      };
    }),

  setOnlineUserIds: (onlineUserIds) => set({ onlineUserIds }),

  setUserTyping: (chatId, userId, name, isTyping) =>
    set((state) => {
      const currentChatTyping = { ...(state.typingUsers[chatId] || {}) };
      if (isTyping) {
        currentChatTyping[userId] = name;
      } else {
        delete currentChatTyping[userId];
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: currentChatTyping,
        },
      };
    }),

  setReplyingToMessage: (replyingToMessage) => set({ replyingToMessage }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setChatFilter: (chatFilter) => set({ chatFilter }),

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    }),
}));
