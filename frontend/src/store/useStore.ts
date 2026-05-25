import { create } from 'zustand';
import type { ChatMessage, PendingAction, Service } from '../types';
import axios from 'axios';

// Polyfill uuid for browser
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const API_BASE = '/api';

interface AppState {
  // ── UI State ─────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  activeTab: 'chat' | 'activity' | 'services' | 'settings';
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: 'chat' | 'activity' | 'services' | 'settings') => void;

  // ── Voice ─────────────────────────────────────────────────────────────
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  setListening: (v: boolean) => void;
  setTranscript: (t: string) => void;

  // ── Chat ──────────────────────────────────────────────────────────────
  messages: ChatMessage[];
  sessionId: string;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;

  // ── Actions ───────────────────────────────────────────────────────────
  pendingActions: PendingAction[];
  activityLog: PendingAction[];
  confirmAction: (actionId: string) => Promise<void>;
  cancelAction: (actionId: string) => Promise<void>;
  loadActivityLog: () => Promise<void>;

  // ── Services ──────────────────────────────────────────────────────────
  services: Service[];
  loadServices: () => Promise<void>;

  // ── Settings ──────────────────────────────────────────────────────────
  spendingLimits: Record<string, number>;
  updateSpendingLimit: (service: string, limit: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // ── UI ────────────────────────────────────────────────────────────────
  sidebarOpen: true,
  activeTab: 'chat',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Voice ────────────────────────────────────────────────────────────
  isListening: false,
  isProcessing: false,
  transcript: '',
  setListening: (v) => set({ isListening: v }),
  setTranscript: (t) => set({ transcript: t }),

  // ── Chat ─────────────────────────────────────────────────────────────
  messages: [
    {
      id: generateId(),
      role: 'assistant',
      content:
        "Hey! 👋 I'm your AgentHub assistant. I can order food from **Swiggy** or **Zomato**, get groceries from **Blinkit** or **Zepto**, book flights, pay bills, and more — all through voice or text.\n\nJust say what you need!",
      timestamp: new Date().toISOString(),
    },
  ],
  sessionId: generateId(),

  sendMessage: async (content: string) => {
    const { messages, sessionId } = get();

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Add typing indicator
    const typingMsg: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isTyping: true,
    };

    set({
      messages: [...messages, userMsg, typingMsg],
      isProcessing: true,
    });

    try {
      // Build conversation history (last 10 messages, excluding typing)
      const history = [...messages]
        .filter((m) => !m.isTyping)
        .slice(-10)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await axios.post(`${API_BASE}/chat`, {
        message: content,
        sessionId,
        conversationHistory: history,
      });

      const { message: reply, pendingAction } = res.data;

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        pendingAction,
      };

      set((state) => ({
        messages: [...state.messages.filter((m) => m.id !== 'typing'), assistantMsg],
        isProcessing: false,
        pendingActions: pendingAction
          ? [...state.pendingActions, pendingAction]
          : state.pendingActions,
      }));
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '⚠️ Sorry, I ran into an error. Please check your API key and try again.',
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages.filter((m) => m.id !== 'typing'), errorMsg],
        isProcessing: false,
      }));
    }
  },

  clearMessages: () =>
    set({
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content:
            "Chat cleared! I'm ready to help. What would you like to do?",
          timestamp: new Date().toISOString(),
        },
      ],
    }),

  // ── Actions ──────────────────────────────────────────────────────────
  pendingActions: [],
  activityLog: [],

  confirmAction: async (actionId: string) => {
    try {
      const res = await axios.post(`${API_BASE}/chat/confirm`, { actionId });
      const { success, message: resultMsg } = res.data;

      // Update messages to reflect completion
      set((state) => {
        const updatedMessages = state.messages.map((msg) => {
          if (msg.pendingAction?.id === actionId) {
            return {
              ...msg,
              pendingAction: {
                ...msg.pendingAction,
                status: (success ? 'completed' : 'failed') as any,
                result: res.data.result,
              },
            };
          }
          return msg;
        });

        const confirmMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: success
            ? `✅ Done! ${resultMsg}. Your action has been completed successfully.`
            : `❌ Something went wrong: ${resultMsg}`,
          timestamp: new Date().toISOString(),
        };

        return {
          messages: [...updatedMessages, confirmMsg],
          pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
        };
      });

      // Refresh activity log
      get().loadActivityLog();
    } catch (err) {
      console.error('Confirm error:', err);
    }
  },

  cancelAction: async (actionId: string) => {
    try {
      await axios.post(`${API_BASE}/chat/cancel`, { actionId });

      set((state) => {
        const updatedMessages = state.messages.map((msg) => {
          if (msg.pendingAction?.id === actionId) {
            return {
              ...msg,
              pendingAction: { ...msg.pendingAction, status: 'cancelled' as any },
            };
          }
          return msg;
        });

        const cancelMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: "Got it, I've cancelled that action. Let me know if you'd like to do something else!",
          timestamp: new Date().toISOString(),
        };

        return {
          messages: [...updatedMessages, cancelMsg],
          pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
        };
      });
    } catch (err) {
      console.error('Cancel error:', err);
    }
  },

  loadActivityLog: async () => {
    try {
      const res = await axios.get(`${API_BASE}/chat/actions`);
      set({ activityLog: res.data.actions || [] });
    } catch (err) {
      console.error('Failed to load activity log:', err);
    }
  },

  // ── Services ─────────────────────────────────────────────────────────
  services: [],
  loadServices: async () => {
    try {
      const res = await axios.get(`${API_BASE}/services`);
      set({ services: res.data.services || [] });
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  },

  // ── Settings ─────────────────────────────────────────────────────────
  spendingLimits: {
    swiggy: 2000,
    zomato: 2000,
    blinkit: 3000,
    zepto: 3000,
    flights: 15000,
    payments: 5000,
  },
  updateSpendingLimit: (service, limit) =>
    set((state) => ({
      spendingLimits: { ...state.spendingLimits, [service]: limit },
    })),
}));
