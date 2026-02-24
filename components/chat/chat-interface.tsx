'use client';

/**
 * 🚀 Comet Studio Chat Interface
 * Clean, Professional, English-only AI interface.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Send, Code2, Settings, Trash2, Copy, Sliders, Layout, FolderPlus, BookOpen, Moon, Sun, Monitor } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { OLLAMA_MODELS, OLLAMA_MODEL_LABELS } from '@/lib/ollama-config';
import { CodePlayground } from '@/components/code-playground/CodePlayground';
import { TemplateGallery } from '@/components/template-gallery';
import { NewProjectDialog } from '@/components/new-project-dialog';
import { extractCodeBlocks } from '@/lib/code-parser';
import { useThemeStore, applyTheme, type Theme } from '@/lib/stores/theme-store';

export function ChatInterface() {
  const {
    currentSession,
    isStreaming,
    sendMessage,
    createSession,
    createSessionFromTemplate,
    clearMessages,
    updateMessageProjectFiles,
    provider,
    setProvider,
    model,
    setModel,
    temperature,
    setTemperature,
  } = useChatStore();

  const { theme, setTheme } = useThemeStore();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [previewCodeId, setPreviewCodeId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [explainCodeId, setExplainCodeId] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTemplateSelect = (code: string) => {
    setInput(`Use this component as a starting point and modify it:\n\n\`\`\`tsx\n${code}\n\`\`\`\n\n`);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleProjectTemplateSelect = (templateKey: string, template: { name: string; mainFile: string; files: Record<string, string> }) => {
    createSessionFromTemplate(templateKey, template);
    setShowNewProject(false);
  };

  const handleExplainCode = async (code: string, id: string) => {
    if (explainCodeId === id && explainResult) {
      setExplainCodeId(null);
      setExplainResult(null);
      return;
    }
    setExplainCodeId(id);
    setExplainLoading(true);
    setExplainResult(null);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'tsx', provider, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Explain failed');
      setExplainResult(data.explanation || '');
    } catch (err) {
      setExplainResult(err instanceof Error ? err.message : 'Failed to explain');
    } finally {
      setExplainLoading(false);
    }
  };

  // Fetch Ollama models when provider is ollama (for custom model list)
  useEffect(() => {
    if (provider === 'ollama') {
      fetch('/api/ollama/models')
        .then((res) => res.json())
        .then((data) => setOllamaModels(data.models || []))
        .catch(() => setOllamaModels([]));
    }
  }, [provider]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Auto-show preview for template messages or when AI generates a React component
  useEffect(() => {
    const msgs = currentSession?.messages ?? [];
    const templateMsg = msgs.find((m) => m.projectFiles);
    if (templateMsg && msgs.length === 1) {
      const parts = parseMessage(templateMsg.content);
      const codeIdx = parts.findIndex((p) => p.type === 'code');
      if (codeIdx >= 0) setPreviewCodeId(`${templateMsg.id}-${codeIdx}`);
      return;
    }
    // Auto-expand last assistant message with React component
    const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant' && !m.isStreaming);
    if (lastAssistant) {
      const parts = parseMessage(lastAssistant.content);
      const idx = parts.findIndex((p) => p.type === 'code' && extractCodeBlocks(`\`\`\`tsx\n${p.content}\n\`\`\``).some((b) => b.hasReactComponent));
      if (idx >= 0) setPreviewCodeId(`${lastAssistant.id}-${idx}`);
    }
  }, [currentSession?.messages]);

  // Apply theme on mount (after persist rehydration)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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
      setInput('');
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 relative">
        {/* Template panel - slide over from right */}
        <NewProjectDialog
          open={showNewProject}
          onOpenChange={setShowNewProject}
          onSelect={handleProjectTemplateSelect}
        />
        {showTemplates && (
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-2xl z-40 bg-white border-l border-gray-200 shadow-xl flex flex-col">
            <TemplateGallery
              onSelect={handleTemplateSelect}
              onClose={() => setShowTemplates(false)}
            />
          </div>
        )}

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Comet Studio
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI component workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Provider</span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none font-medium"
                >
                <option value="ollama">Ollama (Local)</option>
                <option value="kimiclaw">Kimiclaw (OpenClaw)</option>
                <option value="kimi">Kimi (Moonshot)</option>
                <option value="deepseek">DeepSeek V3</option>
                <option value="perplexity">Perplexity</option>
                <option value="openai">GPT-4 Turbo</option>
                <option value="claude">Claude 3.5</option>
              </select>
              </div>

              {provider === 'ollama' && (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-400 outline-none"
                >
                  {(Object.keys(OLLAMA_MODELS) as Array<keyof typeof OLLAMA_MODELS>).map((task) => (
                    <option key={task} value={OLLAMA_MODELS[task]}>
                      {OLLAMA_MODEL_LABELS[task]}
                    </option>
                  ))}
                  {ollamaModels.length > 0 && (
                    <>
                      <option disabled>—</option>
                      {ollamaModels.filter((m) => !(Object.values(OLLAMA_MODELS) as string[]).includes(m)).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </>
                  )}
                </select>
              )}

              <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <Tooltip key={t}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setTheme(t)}
                        className={`p-2 rounded-lg transition-all outline-none ${
                          theme === t ? 'bg-slate-200 text-slate-900' : 'hover:bg-gray-100 text-slate-600'
                        }`}
                      >
                        {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-slate-600 transition-all outline-none"
                  >
                    <FolderPlus className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>New Project</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`p-2 rounded-lg transition-all outline-none ${
                      showTemplates ? 'bg-slate-100 text-slate-900' : 'hover:bg-gray-100 text-slate-600'
                    }`}
                  >
                    <Layout className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Templates</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-slate-600 transition-all outline-none"
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
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-all outline-none"
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
          <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-4">
              <div className="flex items-center gap-4">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Temperature: {temperature}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={temperature} 
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-32 accent-slate-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto space-y-6">
            {!currentSession?.messages.length ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <Code2 className="w-10 h-10 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Comet Studio</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Generate clean React components with AI.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['A login form', 'A pricing table', 'A todo list', 'A dark mode toggle', 'A search bar with filters'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              currentSession.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-xl px-6 py-4 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-slate-900 dark:bg-slate-800 text-white'
                        : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold uppercase tracking-widest ${
                        message.role === 'user' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {message.role === 'user' ? 'User' : `AI • ${message.provider ? String(message.provider).charAt(0).toUpperCase() + String(message.provider).slice(1) : 'AI'}`}
                      </span>
                    </div>

                    <div className={`space-y-4 leading-relaxed ${
                      message.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {parseMessage(message.content).map((part, idx) => (
                        part.type === 'text' ? (
                          <p key={idx}>{part.content}</p>
                        ) : (
                          <div key={idx} className="relative group space-y-2">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {extractCodeBlocks(`\`\`\`tsx\n${part.content}\n\`\`\``).some((b) => b.hasReactComponent) && (
                                <button
                                  onClick={() => setPreviewCodeId(previewCodeId === `${message.id}-${idx}` ? null : `${message.id}-${idx}`)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                                >
                                  {previewCodeId === `${message.id}-${idx}` ? 'Hide Preview' : 'Live Preview'}
                                </button>
                              )}
                              <button
                                onClick={() => handleExplainCode(part.content, `${message.id}-${idx}`)}
                                disabled={explainLoading}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                title="What does this do?"
                              >
                                <BookOpen size={14} />
                                {explainLoading && explainCodeId === `${message.id}-${idx}` ? '...' : 'Explain'}
                              </button>
                              <button
                                onClick={() => copyCode(part.content, `${message.id}-${idx}`)}
                                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-xs transition-all text-slate-600"
                              >
                                {copiedId === `${message.id}-${idx}` ? 'Copied' : <Copy size={14} />}
                              </button>
                            </div>
                            <SyntaxHighlighter
                              language={part.type === 'code' ? (part as { type: 'code'; content: string; language?: string }).language : 'typescript'}
                              style={vscDarkPlus}
                              customStyle={{ borderRadius: '0.75rem', padding: '1.25rem' }}
                            >
                              {part.content}
                            </SyntaxHighlighter>
                            {explainCodeId === `${message.id}-${idx}` && (
                              <div className="mt-3 p-4 rounded-lg bg-slate-900/5 border border-slate-200 text-sm text-slate-700">
                                {explainLoading ? (
                                  <p className="text-slate-500">Explaining...</p>
                                ) : (
                                  <p className="whitespace-pre-wrap">{explainResult}</p>
                                )}
                              </div>
                            )}
                            {previewCodeId === `${message.id}-${idx}` && (
                              <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                <CodePlayground
                                  code={extractCodeBlocks(`\`\`\`tsx\n${part.content}\n\`\`\``).find((b) => b.hasReactComponent)?.code ?? part.content}
                                  language="tsx"
                                  showPreview={true}
                                  projectFiles={message.projectFiles}
                                  mainFile={message.projectFiles ? 'app/page.tsx' : undefined}
                                  onProjectFilesChange={
                                    message.projectFiles
                                      ? (files) => updateMessageProjectFiles(message.id, files)
                                      : undefined
                                  }
                                />
                              </div>
                            )}
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
        <div className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Describe a component..."
                className="flex-1 px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none resize-none"
                style={{ minHeight: '56px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium transition-colors"
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
