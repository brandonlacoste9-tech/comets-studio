'use client';

/**
 * 🚀 Comet Studio Chat Interface
 * The flagship AI chat component with streaming, syntax highlighting, and epic UX
 * 
 * Features:
 * - Real-time streaming with smooth animations
 * - Syntax-highlighted code blocks
 * - Glassmorphism design with gradients
 * - Auto-scroll with scroll-to-bottom
 * - Session management
 * - Provider switching (DeepSeek, OpenAI, Claude)
 * - Copy code blocks
 * - Dark mode optimized
 */

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Sparkles, Send, Code2, Trash2 } from 'lucide-react';
import { useSettings } from '@/lib/store/settings';
import { locales } from '@/lib/locales';
import { MessageItem } from './message-item';

export function ChatInterface() {
  const {
    currentSession,
    isStreaming,
    sendMessage,
    createSession,
    clearMessages,
    provider,
    setProvider,
  } = useChatStore();

  const { language } = useSettings();
  const t = locales[language];

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    if (!currentSession) {
      createSession();
    }

    const message = input;
    setInput('');
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="w-6 h-6 text-cyan-400 opacity-20" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-xs text-slate-400">{t.aiPowered}</p>
            </div>
          </div>

          {/* Provider Selector - Simplified for Comet */}
          <div className="flex items-center gap-4">
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white flex items-center gap-2">
               <span>🧠 {t.model}: Perplexity (Comet)</span>
            </div>
            
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
              title={t.clear}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {!currentSession?.messages.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-xl">
                  <Code2 className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 animate-ping" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{t.welcome}</h2>
                <p className="text-slate-400">{t.welcomeSub}</p>
              </div>
            </div>
          ) : (
            currentSession.messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                disabled={isStreaming}
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none transition-all backdrop-blur-xl"
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
            >
              {isStreaming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.thinking}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t.send}
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Enter</kbd> to send,{' '}
            <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  );
}
