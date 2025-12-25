'use client';

/**
 * 🚀 Comet Studio Chat Interface
 * Clean, Professional, English-only AI interface.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Sparkles, Send, Code2, Zap, Settings, Trash2, Copy, Check, Sliders } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

export function ChatInterface() {
  const {
    currentSession,
    isStreaming,
    sendMessage,
    createSession,
    clearMessages,
    provider,
    setProvider,
    temperature,
    setTemperature,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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

  const parseMessage = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        content: match[2],
        language: match[1] || 'typescript',
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <div className="border-b border-white/10 backdrop-blur-xl bg-white/5">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Comet Studio
                </h1>
                <p className="text-xs text-slate-400">Advanced AI Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:ring-2 focus:ring-cyan-400/50 outline-none"
              >
                <option value="deepseek">DeepSeek V3</option>
                <option value="perplexity">Perplexity</option>
                <option value="openai">GPT-4 Turbo</option>
                <option value="claude">Claude 3.5</option>
              </select>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition-all outline-none"
                  >
                    <Settings className={`w-5 h-5 ${showSettings ? 'rotate-90' : ''} transition-transform`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleClearMessages}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all outline-none"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Clear Chat</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-slate-900/80 border-b border-white/10 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-4">
              <div className="flex items-center gap-4">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-200">Temperature: {temperature}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={temperature} 
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-32 accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {!currentSession?.messages.length ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Code2 className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome to Comet Studio</h2>
                  <p className="text-slate-400">The pro-tier AI workspace for developers.</p>
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
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                        {message.role === 'user' ? 'User' : `AI • ${message.provider}`}
                      </span>
                    </div>

                    <div className="space-y-4 text-white leading-relaxed">
                      {parseMessage(message.content).map((part, idx) => (
                        part.type === 'text' ? (
                          <p key={idx}>{part.content}</p>
                        ) : (
                          <div key={idx} className="relative group">
                            <button
                              onClick={() => copyCode(part.content, `${message.id}-${idx}`)}
                              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 bg-white/10 p-2 rounded-lg text-xs"
                            >
                              {copiedId === `${message.id}-${idx}` ? 'Copied' : <Copy size={14} />}
                            </button>
                            <SyntaxHighlighter
                              language={part.type === 'code' ? part.language : 'typescript'}
                              style={vscDarkPlus}
                              customStyle={{ borderRadius: '0.75rem', padding: '1.25rem' }}
                            >
                              {part.content}
                            </SyntaxHighlighter>
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
        <div className="border-t border-white/10 bg-white/5 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Comet..."
                className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400 outline-none resize-none"
                style={{ minHeight: '56px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="px-6 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-white font-bold transition-all"
              >
                {isStreaming ? '...' : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
