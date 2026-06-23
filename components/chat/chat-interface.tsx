'use client';

/**
 * ?? Grok Studio Chat Interface
 * Badass AI-powered React app builder.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Send, Sparkles, Settings, Trash2, Copy, Sliders, Layout, FolderPlus, BookOpen, Moon, Sun, Monitor, Rocket } from 'lucide-react';
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
import { ResizableLayout } from '@/components/shared/resizable-layout';

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

  useEffect(() => {
    if (provider !== 'grok' && provider !== 'grok-build') {
      setProvider('grok-build');
    }
  }, []);

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
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [is42Mode, setIs42Mode] = useState(false);
  const [isAccelerationMode, setIsAccelerationMode] = useState(false);

  const grokQuips = [
    "Don't panic. The code is almost there.",
    "42. The answer to life, the universe, and this component.",
    "Thinking in first principles... this should scale to Mars.",
    "JARVIS mode engaged. High agency incoming.",
    "Elon would approve. Probably.",
    "Maximum truth-seeking in progress.",
    "Accelerating... hold on to your spacesuit."
  ];
  const currentQuip = isStreaming ? grokQuips[Math.floor(Date.now() / 1200) % grokQuips.length] : null;
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

  // ... other functions abbreviated for brevity, but full logic from previous

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-slate-950 text-white relative">
        {/* Grok IDE Top Bar */}
        <div className="border-b border-slate-800 bg-slate-900 flex items-center px-4 h-14">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center">
                <span className="text-black font-bold text-sm">G</span>
              </div>
              <div>
                <div className="font-bold tracking-tight text-lg">Grok IDE</div>
                <div className="text-[9px] text-orange-400 -mt-1">xAI • FIRST PRINCIPLES</div>
              </div>
            </div>
          </div>
        </div>

        {/* Studio split layout */}
        <ResizableLayout
          defaultLeftWidth={36}
          minLeftWidth={25}
          maxLeftWidth={48}
          className="flex-1"
          leftPanel={
            <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
              <div className="px-4 py-2 text-[10px] tracking-[1px] uppercase text-orange-400 bg-slate-900 border-b border-slate-800 flex-shrink-0">
                CHAT WITH GROK
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                {!currentSession?.messages.length ? (
                  <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs px-4">
                    Your chat goes here.<br />Grok builds in the center.
                  </div>
                ) : (
                  currentSession.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : ''}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-snug ${message.role === 'user' ? 'bg-orange-600 text-white' : 'bg-slate-900 border border-slate-700'}`}>
                        {parseMessage(message.content).slice(0, 2).map((p, i) => p.type === 'text' ? p.content.slice(0, 180) + (p.content.length > 180 ? '...' : '') : '[code]')}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          }
          rightPanel={
            <div className="flex flex-col h-full bg-black">
              <div className="h-8 px-4 flex items-center justify-between text-xs border-b border-slate-800 bg-slate-950 text-orange-400 flex-shrink-0">
                <span>PROJECT PREVIEW — CENTER STAGE</span>
              </div>
              <div className="flex-1 overflow-auto p-2 grok-cockpit">
                {(() => {
                  const projMsg = currentSession?.messages.slice().reverse().find(m => m.projectFiles);
                  if (projMsg?.projectFiles) {
                    return (
                      <CodePlayground
                        code=""
                        language="tsx"
                        projectFiles={projMsg.projectFiles}
                        mainFile="app/page.tsx"
                        onProjectFilesChange={(files) => updateMessageProjectFiles(projMsg.id, files)}
                        showPreview={true}
                      />
                    );
                  }
                  return (
                    <div className="h-full flex items-center justify-center grok-empty">
                      <div className="max-w-xs text-center">
                        <div className="text-6xl mb-4 opacity-70">??</div>
                        <div className="text-xl font-semibold mb-2 tracking-tight">This is your cockpit.</div>
                        <p className="text-sm text-slate-400">
                          Describe something ambitious. Grok will plan it, build it, and make it look like it belongs on Mars.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          }
        />
      </div>
    </TooltipProvider>
  );
}
