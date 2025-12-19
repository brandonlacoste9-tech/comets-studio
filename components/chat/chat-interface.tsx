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

import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Sparkles, Send, Code2, Zap, Settings, Trash2, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Create initial session
  useEffect(() => {
    if (!currentSession) {
      createSession('New Chat');
    }
  }, [currentSession, createSession]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(message);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Copy code to clipboard
  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract code blocks from message
  const parseMessage = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      // Add code block
      parts.push({
        type: 'code',
        content: match[2],
        language: match[1] || 'typescript',
      });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
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
                Comet Studio
              </h1>
              <p className="text-xs text-slate-400">AI-Powered Development</p>
            </div>
          </div>

          {/* Provider Selector */}
          <div className="flex items-center gap-4">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-all focus:ring-2 focus:ring-cyan-400/50"
            >
              <option value="deepseek">⚡ DeepSeek V3</option>
              <option value="openai">🤖 GPT-4 Turbo</option>
              <option value="claude">🧠 Claude</option>
            </select>
            
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
              title="Clear messages"
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
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Comet Studio</h2>
                <p className="text-slate-400">Start building amazing things with AI-powered code generation</p>
              </div>
            </div>
          ) : (
            currentSession.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 backdrop-blur-xl'
                      : 'bg-white/5 border border-white/10 backdrop-blur-xl'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${
                      message.role === 'user' ? 'bg-cyan-400' : 'bg-purple-400'
                    } animate-pulse`} />
                    <span className="text-xs font-medium text-slate-300">
                      {message.role === 'user' ? 'You' : `AI (${message.provider || 'deepseek'})`}
                    </span>
                    {message.isStreaming && (
                      <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="space-y-4">
                    {parseMessage(message.content).map((part, idx) => (
                      part.type === 'text' ? (
                        <p key={idx} className="text-white whitespace-pre-wrap leading-relaxed">
                          {part.content}
                        </p>
                      ) : (
                        <div key={idx} className="relative group">
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => copyCode(part.content, `${message.id}-${idx}`)}
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-white flex items-center gap-1.5 transition-all"
                            >
                              {copiedId === `${message.id}-${idx}` ? (
                                <><Check className="w-3 h-3" /> Copied!</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                              )}
                            </button>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-white/10">
                            <div className="bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b border-white/10">
                              <span className="text-xs text-slate-400 font-mono">{part.type === 'code' && 'language' in part ? part.language : 'text'}</span>
                            </div>
                            <SyntaxHighlighter
                              language={part.type === 'code' && 'language' in part ? part.language : 'text'}
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                padding: '1.5rem',
                                background: 'rgba(15, 23, 42, 0.5)',
                                fontSize: '0.875rem',
                              }}
                            >
                              {part.content}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
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
                placeholder="Ask AI to generate code, refactor, or explain..."
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
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send
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
