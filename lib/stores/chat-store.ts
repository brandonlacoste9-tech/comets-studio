/**
 * Comet Studio Chat Store
 * Zustand store for managing chat messages, streaming state, and AI interactions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { aiService, AIMessage, AIProvider } from '../ai-service';
import { extractReactCode } from '../code-parser';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: AIProvider;
  model?: string;
  isStreaming?: boolean;
  code?: string[]; // Extracted code blocks
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatStore {
  // Current session
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  
  // Streaming state
  isStreaming: boolean;
  streamingMessageId: string | null;
  
  // AI settings
  provider: AIProvider;
  model: string;
  temperature: number;
  
  // Actions
  createSession: (title?: string) => string;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  deleteMessage: (messageId: string) => void;
  
  // Settings
  setProvider: (provider: AIProvider) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  
  // Code extraction
  extractCodeFromMessage: (messageId: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createNewSession = (title?: string): ChatSession => ({
  id: generateId(),
  title: title || `Chat ${new Date().toLocaleString()}`,
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentSession: null,
        sessions: [],
        isStreaming: false,
        streamingMessageId: null,
        provider: 'deepseek',
        model: 'deepseek-chat',
        temperature: 0.7,

        // Session management
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
          if (session) {
            set({ currentSession: session });
          }
        },

        deleteSession: (sessionId) => {
          set((state) => {
            const newSessions = state.sessions.filter((s) => s.id !== sessionId);
            const currentIsDeleted = state.currentSession?.id === sessionId;
            return {
              sessions: newSessions,
              currentSession: currentIsDeleted ? newSessions[0] || null : state.currentSession,
            };
          });
        },

        updateSessionTitle: (sessionId, title) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
            ),
            currentSession:
              state.currentSession?.id === sessionId
                ? { ...state.currentSession, title, updatedAt: Date.now() }
                : state.currentSession,
          }));
        },

        // Message handling with streaming
        sendMessage: async (content) => {
          const { currentSession, provider, model, temperature } = get();
          
          if (!currentSession) {
            get().createSession();
          }

          const session = get().currentSession!;
          
          // Add user message
          const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now(),
          };

          set((state) => ({
            currentSession: {
              ...state.currentSession!,
              messages: [...state.currentSession!.messages, userMessage],
              updatedAt: Date.now(),
            },
          }));

          // Create assistant message placeholder
          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            provider,
            model,
            isStreaming: true,
          };

          set((state) => ({
            currentSession: {
              ...state.currentSession!,
              messages: [...state.currentSession!.messages, assistantMessage],
            },
            isStreaming: true,
            streamingMessageId: assistantMessage.id,
          }));

          try {
            // Prepare messages for AI
            const aiMessages: AIMessage[] = session.messages
              .concat([userMessage])
              .filter((m) => m.role !== 'system')
              .map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              }));

            // Stream response
            const stream = await aiService.streamChatCompletion(aiMessages, {
              provider,
              model,
              temperature,
            });

            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              fullResponse += chunk;

              // Update message with streamed content
              set((state) => ({
                currentSession: {
                  ...state.currentSession!,
                  messages: state.currentSession!.messages.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullResponse }
                      : m
                  ),
                },
              }));
            }

            // Extract code blocks
            const codeBlocks = extractReactCode(fullResponse);

            // Finalize message
            set((state) => ({
              currentSession: {
                ...state.currentSession!,
                messages: state.currentSession!.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, isStreaming: false, code: codeBlocks }
                    : m
                ),
                updatedAt: Date.now(),
              },
              isStreaming: false,
              streamingMessageId: null,
            }));
          } catch (error) {
            console.error('Streaming error:', error);
            
            // Update message with error
            set((state) => ({
              currentSession: {
                ...state.currentSession!,
                messages: state.currentSession!.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? {
                        ...m,
                        content: 'Error generating response. Please try again.',
                        isStreaming: false,
                      }
                    : m
                ),
              },
              isStreaming: false,
              streamingMessageId: null,
            }));
          }
        },

        stopStreaming: () => {
          set({ isStreaming: false, streamingMessageId: null });
        },

        clearMessages: () => {
          set((state) => ({
            currentSession: state.currentSession
              ? { ...state.currentSession, messages: [], updatedAt: Date.now() }
              : null,
          }));
        },

        deleteMessage: (messageId) => {
          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: state.currentSession.messages.filter((m) => m.id !== messageId),
                  updatedAt: Date.now(),
                }
              : null,
          }));
        },

        // Settings
        setProvider: (provider) => set({ provider }),
        setModel: (model) => set({ model }),
        setTemperature: (temperature) => set({ temperature }),

        // Code extraction
        extractCodeFromMessage: (messageId) => {
          const message = get().currentSession?.messages.find((m) => m.id === messageId);
          if (message && message.content) {
            const codeBlocks = extractReactCode(message.content);
            set((state) => ({
              currentSession: {
                ...state.currentSession!,
                messages: state.currentSession!.messages.map((m) =>
                  m.id === messageId ? { ...m, code: codeBlocks } : m
                ),
              },
            }));
          }
        },
      }),
      {
        name: 'comet-chat-storage',
        partialize: (state) => ({
          sessions: state.sessions,
          currentSession: state.currentSession,
          provider: state.provider,
          model: state.model,
          temperature: state.temperature,
        }),
      }
    )
  )
);

export default useChatStore;
