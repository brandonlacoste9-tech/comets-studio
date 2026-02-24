/**
 * Comet Studio Chat Store
 * A clean, English-only store for managing AI interactions and settings.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { extractCodeBlocks } from '../code-parser';

export type AIProvider = 'ollama' | 'kimi' | 'kimiclaw' | 'deepseek' | 'openai' | 'claude' | 'perplexity';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: AIProvider;
  model?: string;
  isStreaming?: boolean;
  code?: string[];
  /** Full project files (e.g. from template) for deploy/export */
  projectFiles?: Record<string, string>;
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
  createSessionFromTemplate: (templateKey: string, template: { name: string; mainFile: string; files: Record<string, string> }) => string;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  deleteMessage: (messageId: string) => void;
  updateMessageProjectFiles: (messageId: string, projectFiles: Record<string, string>) => void;
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
        provider: 'ollama',
        model: 'deepseek-coder',
        temperature: 0.7,

        createSession: (title) => {
          const newSession = createNewSession(title);
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
          }));
          return newSession.id;
        },

        createSessionFromTemplate: (templateKey, template) => {
          const { provider } = get();
          const mainCode = template.files[template.mainFile] || '';
          const content = `I've created a **${template.name}** project. Here's the main file:\n\n\`\`\`tsx\n${mainCode}\n\`\`\`\n\nYou can edit it, deploy, or export the full project.`;
          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content,
            timestamp: Date.now(),
            provider,
            code: [mainCode],
            projectFiles: template.files,
          };
          const newSession: ChatSession = {
            id: generateId(),
            title: template.name,
            messages: [assistantMessage],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
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
            const history = (currentSession?.messages ?? []).map((m) => ({ role: m.role, content: m.content }))
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                message: content, 
                messages: history,
                chatId: currentSession?.id, 
                streaming: true,
                provider,
                model,
                temperature,
              }),
            });

            if (!response.ok) {
              let errMsg = 'Failed to connect to AI service.';
              try {
                const data = await response.json();
                errMsg = data.error || data.details || errMsg;
              } catch {
                // ignore
              }
              throw new Error(errMsg);
            }

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
            const errText = error instanceof Error ? error.message : 'Failed to connect to AI service.';
            set((state) => ({
              isStreaming: false,
              streamingMessageId: null,
              currentSession: {
                ...state.currentSession!,
                messages: state.currentSession!.messages.map((m) =>
                  m.id === assistantMessage.id ? { ...m, content: `Error: ${errText}`, isStreaming: false } : m
                ),
              },
            }));
          }
        },

        stopStreaming: () => set({ isStreaming: false, streamingMessageId: null }),
        clearMessages: () => set((state) => ({ currentSession: state.currentSession ? { ...state.currentSession, messages: [], updatedAt: Date.now() } : null })),
        deleteMessage: (messageId) => set((state) => ({ currentSession: state.currentSession ? { ...state.currentSession, messages: state.currentSession.messages.filter((m) => m.id !== messageId), updatedAt: Date.now() } : null })),
        updateMessageProjectFiles: (messageId, projectFiles) =>
          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: state.currentSession.messages.map((m) =>
                    m.id === messageId ? { ...m, projectFiles } : m
                  ),
                  updatedAt: Date.now(),
                }
              : null,
          })),
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
