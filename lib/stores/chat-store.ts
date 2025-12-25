/**
 * Comet Studio Chat Store
 * A clean, English-only store for managing AI interactions and settings.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { extractCodeBlocks } from '../code-parser';

export type AIProvider = 'deepseek' | 'openai' | 'claude' | 'perplexity';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: AIProvider;
  model?: string;
  isStreaming?: boolean;
  code?: string[]; 
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatStore {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  provider: AIProvider;
  model: string;
  temperature: number;
  
  createSession: (title?: string) => string;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  deleteMessage: (messageId: string) => void;
  setProvider: (provider: AIProvider) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createNewSession = (title?: string): ChatSession => ({
  id: generateId(),
  title: title || `New Chat ${new Date().toLocaleTimeString()}`,
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        currentSession: null,
        sessions: [],
        isStreaming: false,
        streamingMessageId: null,
        provider: 'deepseek',
        model: 'deepseek-chat',
        temperature: 0.7,

        createSession: (title) => {
          const newSession = createNewSession(title);
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
          }));
          return newSession.id;
        },

        loadSession: (sessionId) => {
          const session = get().sessions.find((s) => s.id === sessionId);
          if (session) set({ currentSession: session });
        },

        deleteSession: (sessionId) => {
          set((state) => {
            const newSessions = state.sessions.filter((s) => s.id !== sessionId);
            return {
              sessions: newSessions,
              currentSession: state.currentSession?.id === sessionId ? newSessions[0] || null : state.currentSession,
            };
          });
        },

        updateSessionTitle: (sessionId, title) => {
          set((state) => ({
            sessions: state.sessions.map((s) => s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s),
            currentSession: state.currentSession?.id === sessionId ? { ...state.currentSession, title, updatedAt: Date.now() } : state.currentSession,
          }));
        },

        sendMessage: async (content) => {
          const { currentSession, provider, model, temperature } = get();
          if (!currentSession) get().createSession();
          
          const userMessage: ChatMessage = { id: generateId(), role: 'user', content, timestamp: Date.now() };
          const assistantMessage: ChatMessage = { id: generateId(), role: 'assistant', content: '', timestamp: Date.now(), provider, model, isStreaming: true };

          set((state) => ({
            currentSession: {
              ...state.currentSession!,
              messages: [...state.currentSession!.messages, userMessage, assistantMessage],
              updatedAt: Date.now(),
            },
            isStreaming: true,
            streamingMessageId: assistantMessage.id,
          }));

          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                message: content, 
                chatId: currentSession?.id, 
                streaming: true,
                provider,
                model,
                temperature,
              }),
            });

            if (!response.ok) throw new Error('Failed to connect to AI');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                  try {
                    const data = JSON.parse(line);
                    fullResponse += data.content || '';
                    
                    set((state) => ({
                      currentSession: {
                        ...state.currentSession!,
                        messages: state.currentSession!.messages.map((m) =>
                          m.id === assistantMessage.id ? { ...m, content: fullResponse } : m
                        ),
                      },
                    }));
                  } catch (e) {
                    console.warn('Chunk parse error', e);
                  }
                }
              }
            }

            const codeBlocks = extractCodeBlocks(fullResponse).map(block => block.code);
            set((state) => ({
              currentSession: {
                ...state.currentSession!,
                messages: state.currentSession!.messages.map((m) =>
                  m.id === assistantMessage.id ? { ...m, isStreaming: false, code: codeBlocks } : m
                ),
              },
              isStreaming: false,
              streamingMessageId: null,
            }));
          } catch (error) {
            console.error('Chat error:', error);
            set((state) => ({
              isStreaming: false,
              streamingMessageId: null,
              currentSession: {
                ...state.currentSession!,
                messages: state.currentSession!.messages.map((m) =>
                  m.id === assistantMessage.id ? { ...m, content: 'Error: Failed to connect to AI service.', isStreaming: false } : m
                ),
              },
            }));
          }
        },

        stopStreaming: () => set({ isStreaming: false, streamingMessageId: null }),
        clearMessages: () => set((state) => ({ currentSession: state.currentSession ? { ...state.currentSession, messages: [], updatedAt: Date.now() } : null })),
        deleteMessage: (messageId) => set((state) => ({ currentSession: state.currentSession ? { ...state.currentSession, messages: state.currentSession.messages.filter((m) => m.id !== messageId), updatedAt: Date.now() } : null })),
        setProvider: (provider) => set({ provider }),
        setModel: (model) => set({ model }),
        setTemperature: (temperature) => set({ temperature }),
      }),
      {
        name: 'comet-chat-storage',
      }
    )
  )
);

export default useChatStore;
