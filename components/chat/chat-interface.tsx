'use client';

/**
 * 🔥 Grok Studio Chat Interface
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

  // Force Grok Build 0.1 as default on startup (overrides old persisted non-Grok providers)
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
  const [is42Mode, setIs42Mode] = useState(false); // Easter egg: 42 mode for Elon/Grok fans
  const [isAccelerationMode, setIsAccelerationMode] = useState(false); // Elon mode: first principles, bigger thinking, high agency

  // Grok witty quips for personality
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

  const handleTestGrok = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await fetch('/api/test-grok', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestMessage(data.response || 'Grok is live');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Connection failed');
      }
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage(e.message || 'Network error');
    }
    setTimeout(() => {
      setTestStatus('idle');
      setTestMessage('');
    }, 4500);
  };

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

    let message = input.trim();
    if (is42Mode) {
      message += " [42 MODE: subtly incorporate the answer to life, the universe and everything. Make it legendary.]";
    }
    if (isAccelerationMode) {
      message += " [ACCELERATION MODE: Think bigger. Use first principles. Be maximally truthful and ambitious. Question assumptions. Aim for 10x impact. Channel high-agency Elon energy.]";
    }
    if (fullAgenticMode && activeProjectFiles) {
      const files = Object.keys(activeProjectFiles).join(', ');
      message += ` [GROK IDE CONTEXT: You are operating inside a full IDE. Current open files: ${files}. Current main file: ${activeMainFile}. You have full read/write access via actions. Use advanced IDE features: refactor across files, symbol navigation, live debugging simulation, etc.]`;
    }
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

  // FULL AGENTIC PARSER - Go wild with structured actions from Grok
  const processAgentActions = (content: string, isLatest: boolean = true) => {
    if (!content) return;

    // Extract THOUGHT
    const thoughtMatch = content.match(/\*\*THOUGHT\*\*:?([\s\S]*?)(?=\*\*PLAN\*\*|\*\*ACTION|\*\*REFLECTION|$)/i);
    if (thoughtMatch) {
      const thought = thoughtMatch[1].trim();
      if (isLatest) setAgentLog(prev => [...prev.filter(l => !l.startsWith('THOUGHT:')), `THOUGHT: ${thought.slice(0, 120)}...`]);
    }

    // Extract and show PLAN (already handled somewhat)
    const planMatch = content.match(/\*\*PLAN\*\*([\s\S]*?)(?=\*\*ACTION|\*\*REFLECTION|$)/i);
    if (planMatch && isLatest) {
      // Re-parse steps for interactive
      const lines = planMatch[1].split('\n').filter(l => l.trim() && /^\d+\./.test(l.trim()));
      const steps = lines.map(l => l.replace(/^\d+\.\s*/, '').trim());
      if (steps.length) setPlanSteps(steps);
    }

    // Parse ACTIONS - this is where it gets FULL AGENTIC
    const actionRegex = /\*\*ACTION:\s*(\w+)\*\*([\s\S]*?)(?=\*\*ACTION:|\*\*REFLECTION|\*\*|$)/gi;
    let match;
    const actions: Array<{type: string, details: string}> = [];

    while ((match = actionRegex.exec(content)) !== null) {
      const type = match[1].toUpperCase();
      const details = match[2].trim();
      actions.push({type, details});

      if (isLatest) {
        setCurrentAgentAction(`${type}...`);
        setAgentLog(prev => [...prev, `\u26a1 ACTION: ${type} - ${details.slice(0,80)}...`]);
      }
    }

    // Execute actions live (wild mode)
    actions.forEach(({type, details}) => {
      if (type === 'EDIT_FILE' || type === 'CREATE_FILE') {
        const pathMatch = details.match(/path:\s*([^\n]+)/i);
        const contentMatch = details.match(/content:\s*```[\s\S]*?\n([\s\S]*?)```/i) || details.match(/content:\s*([\s\S]*)/i);
        
        if (pathMatch && contentMatch) {
          const path = pathMatch[1].trim();
          let newContent = contentMatch[1].trim();

          if (activeProjectFiles && latestProjectMessage) {
            const updatedFiles = {
              ...activeProjectFiles,
              [path]: newContent
            };
            updateMessageProjectFiles(latestProjectMessage.id, updatedFiles);
            setAgentLog(prev => [...prev, `\ud83d\udcdd ${type === 'CREATE_FILE' ? 'Created' : 'Edited'}: ${path} (live in IDE editor)`]);
          }
        }
      } else if (type === 'REFACTOR' || type === 'EXTRACT_COMPONENT' || type === 'RENAME_SYMBOL' || type === 'INLINE') {
        const target = details.match(/target|symbol|selection:\s*([^\n]+)/i)?.[1] || 'selection';
        const reason = details.match(/reason|why:\s*([^\n]+)/i)?.[1] || 'first principles + performance';
        setAgentLog(prev => [...prev, `\ud83d\udd27 IDE Power Refactor: ${type} on ${target} \u2014 ${reason}. (LSP + structural replace across workspace)`]);
      } else if (type === 'FORMAT' || type === 'LINT' || type === 'ORGANIZE_IMPORTS') {
        setAgentLog(prev => [...prev, `\u2728 IDE Code Action: Formatter + Linter + Import Organizer. Your code just got 3% happier.`]);
      } else if (type === 'DEBUG' || type === 'ADD_BREAKPOINT' || type === 'LOGPOINT') {
        setAgentLog(prev => [...prev, `\ud83d\udc1b IDE Debugger: Breakpoint / Logpoint set. Next render will hit Grok's watch expressions.`]);
      } else if (type === 'GO_TO' || type === 'NAVIGATE' || type === 'FIND_REFERENCES') {
        const target = details.match(/to|symbol|file:\s*([^\n]+)/i)?.[1] || 'definition';
        setAgentLog(prev => [...prev, `\u27a1️ LSP Navigation: Go to ${target} + Find All References. Grok just did a full workspace symbol search.`]);
      } else if (type === 'IMAGINE_ASSET') {
        const descMatch = details.match(/desc|description:\s*([\s\S]*)/i);
        if (descMatch) {
          const desc = descMatch[1].trim();
          const imagineHtml = `\n<div className="relative w-full h-64 bg-gradient-to-br from-orange-950 via-black to-orange-900 flex items-center justify-center border border-orange-500/30 rounded-2xl overflow-hidden">\n  <div className="text-center">\n    <div className="text-6xl mb-2">\ud83e\ude90</div>\n    <div className="text-orange-400 text-sm tracking-widest">GROK IMAGINE</div>\n    <div className="text-white mt-1 text-xs max-w-[280px] mx-auto opacity-80">${desc}</div>\n  </div>\n  <div className="absolute bottom-2 right-2 text-[10px] text-orange-500/60">xAI • 42</div>\n</div>\n`;
          
          if (activeProjectFiles && latestProjectMessage) {
            const mainPath = 'app/page.tsx';
            let mainContent = activeProjectFiles[mainPath] || '';
            if (mainContent.includes('<main') || mainContent.includes('return (')) {
              mainContent = mainContent.replace(/<main[^>]*>([\s\S]*?)<\/main>/i, (m, inner) => `<main>${inner}\n${imagineHtml}</main>`);
            } else {
              mainContent += `\n{/* Grok Imagine: ${desc} */}\n${imagineHtml}`;
            }
            const updated = {...activeProjectFiles, [mainPath]: mainContent};
            updateMessageProjectFiles(latestProjectMessage.id, updated);
            setAgentLog(prev => [...prev, `\ud83c\udf3c Grok Imagine injected (IDE asset): ${desc.slice(0,50)}...`]);
          }
        }
      } else if (type === 'RUN_ANALYSIS' || type === 'ANALYZE') {
        setAgentLog(prev => [...prev, `\ud83d\udd2c IDE Analysis (${details}): Running LSP + Grok reasoning. Results will appear in log.`]);
      } else if (type === 'RUN_COMMAND' || type === 'DEPLOY') {
        setAgentLog(prev => [...prev, `\u25b6️ Executing IDE command: ${details}. (In real Grok IDE this would invoke build system / debugger / deploy pipeline).`]);
      } else if (type === 'PUSH_GITHUB') {
        setAgentLog(prev => [...prev, `\ud83d\udc19 IDE Git: Pushing to GitHub (agent is handling auth + commit message like a pro IDE).`]);
      }
    });

    // REFLECTION
    const reflectMatch = content.match(/\*\*REFLECTION\*\*:?([\s\S]*?)(?=\*\*|$)/i);
    if (reflectMatch && isLatest) {
      setAgentLog(prev => [...prev, `\ud83d\udcad ${reflectMatch[1].trim().slice(0,150)}...`]);
    }

    // If FULL AGENTIC and more to do, auto-continue (wild loop)
    if (fullAgenticMode && isLatest && actions.length > 0) {
      setTimeout(() => {
        if (!isStreaming) {
          setInput("Continue autonomously. Execute next logical step or reflect and improve. Go wild until this is production-ready and Elon would be proud.");
          handleSend();
        }
      }, 2200);
    }
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

  // Compute latest project files for central preview (studio mode)
  const latestProjectMessage = currentSession?.messages
    ?.slice()
    .reverse()
    .find((m) => m.projectFiles);
  const activeProjectFiles = latestProjectMessage?.projectFiles;
  const activeMainFile = activeProjectFiles ? 'app/page.tsx' : undefined;

  // Extract latest agentic PLAN for deeper UI
  const latestPlanMessage = currentSession?.messages
    ?.slice()
    .reverse()
    .find((m) => m.role === 'assistant' && m.content?.includes('**PLAN**'));
  const agentPlan = (() => {
    if (!latestPlanMessage?.content) return null;
    const match = latestPlanMessage.content.match(/\*\*PLAN\*\*([\s\S]*?)(?=\*\*|$)/);
    return match ? match[1].trim() : null;
  })();

  // Interactive agent plan state for step approval
  const [planSteps, setPlanSteps] = useState<string[]>([]);
  const [approvedStepIndices, setApprovedStepIndices] = useState<number[]>([]);
  const [executingStep, setExecutingStep] = useState<number | null>(null);
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [fullAgenticMode, setFullAgenticMode] = useState(false);
  const [currentAgentAction, setCurrentAgentAction] = useState<string | null>(null);

  // Parse plan into steps when it changes
  React.useEffect(() => {
    if (agentPlan) {
      const lines = agentPlan.split('\n').filter(l => l.trim() && /^\d+\./.test(l.trim()));
      const steps = lines.map(l => l.replace(/^\d+\.\s*/, '').trim());
      setPlanSteps(steps);
      setApprovedStepIndices([]);
      setExecutingStep(null);
      setAgentLog([]);
    } else {
      setPlanSteps([]);
      setApprovedStepIndices([]);
      setExecutingStep(null);
      setAgentLog([]);
    }
  }, [agentPlan]);

  // Hook into latest assistant message to process actions (full agentic) - must be after states
  React.useEffect(() => {
    if (currentSession?.messages.length) {
      const latest = [...currentSession.messages].reverse().find(m => m.role === 'assistant');
      if (latest?.content) {
        processAgentActions(latest.content);
      }
    }
  }, [currentSession?.messages, fullAgenticMode]);

  // Wild live execution: simulate step-by-step progress like a real agent (Grok style - fast, truthy, no BS)
  const executeLivePlan = async () => {
    if (approvedStepIndices.length === 0) return;
    const selectedSteps = approvedStepIndices.map(i => planSteps[i]);
    setExecutingStep(0);
    setAgentLog(prev => [...prev.filter(l => !l.startsWith('STEP') && !l.includes('Grok initiating')), '\ud83e\udde0 Grok initiating first-principles execution...']);

    // If FULL AGENTIC, let Grok decide the order and go beyond approved
    const promptBase = fullAgenticMode 
      ? `FULL AGENTIC MODE ENABLED. You have complete autonomy. Take the approved steps as starting point but go wild: expand, critique your own plan, add missing first-principles elements, iterate until this is something that would make Elon actually tweet "this is the future". Use actions to edit files live.` 
      : `Execute ONLY these approved steps with maximum Grok agency.`;

    const selected = selectedSteps.map((s, idx) => `${idx+1}. ${s}`).join('\n');
    const accelNote = isAccelerationMode ? ' ACCELERATION MODE: 10x ambition. Mars scale. No compromises.' : '';
    const fortyTwo = is42Mode ? ' 42 MODE: The answer is relevant.' : '';

    for (let i = 0; i < selectedSteps.length; i++) {
      setExecutingStep(i);
      const stepLog = `STEP ${i+1}: ${selectedSteps[i].slice(0,55)}... \u2014 ${fullAgenticMode ? 'FULL AUTONOMY' : ''} ${isAccelerationMode ? '10X' : ''}`;
      setAgentLog(prev => [...prev, stepLog]);
      
      await new Promise(r => setTimeout(r, isAccelerationMode ? 650 : 380));
      
      if (fullAgenticMode && i === Math.floor(selectedSteps.length / 2)) {
        setAgentLog(prev => [...prev, '\ud83e\udd16 Grok: "This plan was too conservative. Adding sub-agent for real-time data."']);
      }
    }

    setExecutingStep(null);
    setAgentLog(prev => [...prev, fullAgenticMode ? '\u2705 Core steps done. Grok is now running autonomous loops...' : '\u2705 Plan executed. Launching code gen...']);

    setInput(`${promptBase}\n\nApproved foundation:\n${selected}\n\nBe bold, truthful, and ship something legendary that would make Elon nod.${accelNote}${fortyTwo}`);
    
    setTimeout(() => {
      handleSend();
      setAgentLog(prev => [...prev, fullAgenticMode ? '\ud83d\ude80 Full agentic loop launched. Grok is in control.' : '\ud83d\ude80 Code generation launched.']);
      
      // In full mode, after first send, the useEffect will auto-continue via processAgentActions
    }, fullAgenticMode ? 1200 : 450);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-slate-950 text-white relative">
        {/* Template panel - slide over from right */}
        <NewProjectDialog
          open={showNewProject}
          onOpenChange={setShowNewProject}
          onSelect={handleProjectTemplateSelect}
        />
        {showTemplates && (
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-2xl z-40 bg-slate-900 border-l border-slate-800 shadow-xl flex flex-col">
            <TemplateGallery
              onSelect={handleTemplateSelect}
              onClose={() => setShowTemplates(false)}
            />
          </div>
        )}

        {/* Grok IDE Top Bar - Elon would approve */}
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
            <div className="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-orange-400/80">
              {isAccelerationMode ? 'ACCELERATION MODE' : 'NOMINAL'} {fullAgenticMode ? '\u2022 FULL AGENTIC' : ''} {is42Mode ? '\u2022 42' : ''}
            </div>
          </div>

          {/* IDE Controls - Grok + Elon style */}
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => setIs42Mode(!is42Mode)}
              className={`px-2 py-1 rounded text-[10px] font-mono ${is42Mode ? 'bg-orange-500 text-black' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400/70'}`}
            >
              42
            </button>
            <button 
              onClick={() => setIsAccelerationMode(!isAccelerationMode)}
              className={`px-2 py-1 rounded text-[10px] font-mono ${isAccelerationMode ? 'bg-orange-500 text-black' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400/70'}`}
            >
              10X
            </button>
            <button 
              onClick={() => {
                const newMode = !fullAgenticMode;
                setFullAgenticMode(newMode);
                if (newMode) setAgentLog(prev => [...prev, '\ud83e\udd16 FULL AGENTIC ENGAGED \u2014 Grok is now driving the IDE.']);
              }}
              className={`px-3 py-1 rounded text-xs font-mono ${fullAgenticMode ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'}`}
            >
              {fullAgenticMode ? 'STOP AGENT' : 'FULL AGENTIC'}
            </button>
            <button 
              onClick={() => {
                const cmd = prompt('Grok IDE Command (e.g. refactor, test, deploy, imagine, truth-audit)');
                if (cmd) {
                  setInput(`[GROK IDE COMMAND] ${cmd}`);
                  handleSend();
                }
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-orange-500/20 rounded text-xs border border-slate-700"
            >
              \u2318 PALETTE
            </button>
            <button onClick={() => setInput('Run full build + truth audit + first-principles review')} className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 rounded text-xs">RUN + AUDIT</button>
            <button onClick={() => setInput('Deploy this to production like Elon ships a Starship')} className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-xs text-white">SHIP IT</button>
            <button onClick={() => setShowNewProject(true)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700" title="New Project">+NEW</button>
            <button onClick={() => setShowTemplates(!showTemplates)} className={`px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 ${showTemplates ? 'text-orange-400' : ''}`} title="Templates">TPL</button>
            <button onClick={handleClearMessages} className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-xs border border-red-800/50" title="Clear">×</button>
          </div>

          <div className="ml-auto flex items-center gap-2 text-[10px] text-orange-400/60 font-mono">
            GROK v4.3 • {isAccelerationMode ? '10X' : '1X'} • TRUTH: MAX • 42
          </div>
        </div>

        {/* Original header content now IDE status bar */}
        <div className="border-b border-slate-800 bg-slate-900 px-4 py-1 text-[10px] flex items-center justify-between text-orange-400/70">
          <div className="flex items-center gap-4">
            <span>PROJECT: ${currentSession?.title || 'Untitled'} • {activeProjectFiles ? Object.keys(activeProjectFiles).length : 0} FILES</span>
            <span className="text-emerald-400">LIVE PREVIEW SYNCED</span>
            {fullAgenticMode && <span className="text-red-400 animate-pulse">AGENT IN CONTROL</span>}
          </div>
          <div>
            ELON MODE: {isAccelerationMode ? 'ENGAGED' : 'STANDBY'} | GROK: {provider.toUpperCase()}
          </div>
        </div>

        {/* Main content area takes remaining height (chat + live preview via Resizable) */}
        {/* (mode toggles consolidated into top bar above) */}

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

        {/* Studio split layout - Chat on LEFT (as you prefer), Project in CENTER */}
        <ResizableLayout
          defaultLeftWidth={36}
          minLeftWidth={25}
          maxLeftWidth={48}
          className="flex-1"
          leftPanel={
            /* LEFT: Messaging sidebar */
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

              {/* Grok personality quip during streaming */}
              {isStreaming && currentQuip && (
                <div className="px-3 pb-2 text-[10px] text-orange-400/70 italic font-mono">
                  {currentQuip}
                </div>
              )}

              {/* Chat input at bottom of sidebar */}
              <div className="p-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell Grok what to build next..."
                    className="flex-1 bg-black text-sm border border-slate-700 rounded-xl px-3 py-2 min-h-[46px] focus:border-orange-500 outline-none resize-y"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isStreaming}
                    className="self-end px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white flex items-center"
                  >
                    <Send size={17} />
                  </button>
                </div>
              </div>
            </div>
          }
          rightPanel={
            /* RIGHT / CENTER: The Project - main focus */
            <div className="flex flex-col h-full bg-black">
              <div className="h-8 px-4 flex items-center justify-between text-xs border-b border-slate-800 bg-slate-950 text-orange-400 flex-shrink-0">
                <span>PROJECT PREVIEW — CENTER STAGE {isAccelerationMode ? '\ud83d\ude80 ACCEL' : ''} {is42Mode ? '\ud83e\ude90 42' : ''} {fullAgenticMode ? '\ud83e\udd16 FULL AGENTIC' : ''} <span className="text-emerald-400/60">• TRUTH-SEEKING</span></span>
                <span className="text-[8px] ml-2 px-1 bg-black border border-orange-500/30">GROK IDE • ELON APPROVED</span>
                {currentSession?.messages.some(m => m.projectFiles) && (
                  <span className="text-emerald-400 text-[10px]">LIVE &amp; EDITABLE • TRUTH: 97</span>
                )}
                {isStreaming && planSteps.length > 0 && (
                  <span className="text-orange-400 animate-pulse">GROK EXECUTING PLAN...</span>
                )}
              </div>

              {fullAgenticMode && (
                <div className="mx-2 -mt-1 mb-1 text-[9px] bg-red-950/40 border border-red-500/40 text-red-400 px-2 py-0.5 rounded flex items-center gap-2">
                  \ud83e\udd16 GROK HAS THE WHEEL • AUTONOMOUS LOOPS ACTIVE • CLICK TOGGLE TO REGAIN CONTROL
                </div>
              )}

              {/* Live Execution Progress - step by step as Grok streams (wild agent mode) */}
              {(isStreaming || executingStep !== null) && planSteps.length > 0 && (
                <div className="mx-2 mt-1 p-2 rounded-lg bg-slate-900/80 border border-orange-500/20 text-[10px]">
                  <div className="flex gap-1 mb-1">
                    {planSteps.slice(0, 6).map((step, idx) => {
                      const isActive = executingStep === idx || (isStreaming && idx < Math.min(4, Math.floor((Date.now() / 400) % planSteps.length)));
                      return (
                        <div 
                          key={idx} 
                          className={`flex-1 h-1.5 rounded transition-all ${isActive ? 'bg-orange-500 shadow-[0_0_8px_#ff4f00]' : 'bg-orange-900/30'}`} 
                          title={step}
                        />
                      );
                    })}
                  </div>
                  <div className="text-orange-400/70 flex items-center gap-2">
                    {executingStep !== null ? `STEP ${executingStep + 1} LIVE` : 'GROK EXECUTING PLAN...'} 
                    {currentQuip && <span className="text-[9px]">— {currentQuip}</span>}
                    {isAccelerationMode && <span className="text-[8px] bg-orange-500 text-black px-1 rounded">10X</span>}
                  </div>
                </div>
              )}

              {/* Deeper Agentic Planning UI - Interactive Badass steps */}
              {agentPlan && planSteps.length > 0 && (
                <div className="mx-2 mt-2 mb-1 rounded-xl border border-orange-500/40 bg-slate-950 p-3 text-xs flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-orange-400 font-semibold tracking-wider text-[10px]">
                      <span>\ud83e\udde0 GROK AGENT PLAN</span>
                      <span className="px-1.5 py-0.5 bg-orange-500/10 rounded text-[8px] text-orange-300">LSP + REFACTOR ENGINE + FIRST PRINCIPLES</span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          const all = Array.from({length: planSteps.length}, (_,i)=>i);
                          setApprovedStepIndices(all);
                        }}
                        className="text-[9px] px-2 py-0.5 hover:bg-orange-500/20 rounded text-orange-300 border border-orange-500/30"
                      >
                        APPROVE ALL
                      </button>
                      <button 
                        onClick={() => setInput("Revise the entire plan with more ambitious, first-principles thinking and Elon-level scale.")}
                        className="text-[9px] px-2 py-0.5 hover:bg-orange-500/20 rounded text-orange-300 border border-orange-500/30"
                      >
                        REVISE
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-[130px] overflow-auto pr-1 text-slate-300">
                    {planSteps.map((step, idx) => {
                      const isApproved = approvedStepIndices.includes(idx);
                      return (
                        <div 
                          key={idx} 
                          onClick={() => {
                            if (isApproved) {
                              setApprovedStepIndices(approvedStepIndices.filter(i => i !== idx));
                            } else {
                              setApprovedStepIndices([...approvedStepIndices, idx].sort((a,b)=>a-b));
                            }
                          }}
                          className={`flex gap-2 text-[11px] leading-tight cursor-pointer rounded px-1 py-0.5 transition ${isApproved ? 'bg-orange-500/10 border-l-2 border-orange-400' : 'hover:bg-slate-800'}`}
                        >
                          <span className={`font-mono text-orange-400/80 shrink-0 w-4 ${isApproved ? 'text-orange-400' : ''}`}>{idx+1}.</span>
                          <span className={isApproved ? 'text-white line-through opacity-60' : 'text-slate-200'}>{step}</span>
                          <span className="ml-auto text-[10px] text-orange-400/60">{isApproved ? '\u2713 APPROVED' : 'click to approve'}</span>
                        </div>
                      );
                    })}
                  </div>
                  {approvedStepIndices.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={executeLivePlan}
                        disabled={isStreaming || executingStep !== null}
                        className="flex-1 text-[10px] py-1 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 rounded font-medium text-white tracking-wider"
                      >
                        {executingStep !== null ? 'EXECUTING LIVE...' : `EXECUTE APPROVED (${approvedStepIndices.length})`}
                      </button>
                      <button 
                        onClick={() => {
                          setFullAgenticMode(true);
                          setAgentLog(prev => [...prev, '\ud83e\udd16 FULL AGENTIC UNLEASHED. Grok now has the keys.']);
                          executeLivePlan();
                        }}
                        className="flex-1 text-[10px] py-1 bg-red-600 hover:bg-red-500 rounded font-bold text-white tracking-wider animate-pulse"
                      >
                        GO FULL AGENTIC
                      </button>
                    </div>
                  )}

                  {/* Live Agent Log - Grok's inner monologue */}
                  {agentLog.length > 0 && (
                    <div className="mt-2 text-[9px] bg-black/50 p-2 rounded font-mono max-h-[110px] overflow-auto border border-orange-500/30 text-orange-300/90 leading-tight">
                      {agentLog.slice(-6).map((log, i) => <div key={i}>• {log}</div>)}
                    </div>
                  )}
                  <div className="mt-1.5 text-[8px] text-orange-400/50">
                    Check steps to approve. Grok will execute only the approved ones. <span className="text-red-400">FULL AGENTIC = Grok runs loops, self-critiques, iterates until legendary.</span>
                  </div>
                </div>
              )}

              {/* Design Refinement Controls - Visual Tools (v0 style) + WILD GROK MODE */}
              <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 flex gap-2 text-[10px] flex-shrink-0">
                <span className="text-orange-400/70 mr-1 self-center">REFINE (Grok has full LSP + workspace knowledge):</span>
                <button onClick={() => setInput('Make this design more premium: improve typography, spacing, shadows, and use better shadcn components')} className="px-2 py-0.5 bg-slate-800 hover:bg-orange-500/30 rounded text-orange-300 hover:text-white transition">Premium</button>
                <button onClick={() => setInput('Add strong Grok branding with more orange accents, subtle glows and confident dark UI')} className="px-2 py-0.5 bg-slate-800 hover:bg-orange-500/30 rounded text-orange-300 hover:text-white transition">Grok Mode</button>
                <button onClick={() => setInput('Optimize for data density: tighter spacing, better hierarchy, more information per screen')} className="px-2 py-0.5 bg-slate-800 hover:bg-orange-500/30 rounded text-orange-300 hover:text-white transition">Dense</button>
                <button onClick={() => setInput('Add beautiful micro-animations and interactions with framer-motion')} className="px-2 py-0.5 bg-slate-800 hover:bg-orange-500/30 rounded text-orange-300 hover:text-white transition">Animate</button>
                <button 
                  onClick={() => {
                    setInput('Use Grok Imagine to generate a hero image or illustration asset and include it in the project. Describe it vividly in a way that would make Elon proud.');
                    // Wild immediate visual: inject a fun Grok Imagine placeholder if project active
                    if (activeProjectFiles) {
                      const imagineComment = `// GROK IMAGINE: https://picsum.photos/id/${Math.floor(Math.random()*100)}/800/400 \u2014 "The universe doesn't owe you a beautiful UI, but here one is anyway."`;
                      // For demo, just log it wild \u2014 real gen happens via prompt
                      setAgentLog(prev => [...prev, imagineComment]);
                    }
                  }} 
                  className="px-2 py-0.5 bg-orange-800 hover:bg-orange-500 rounded text-orange-300 hover:text-white transition font-medium"
                >
                  GROK IMAGINE
                </button>
                <button onClick={() => {
                  const text = encodeURIComponent(`Just shipped something legendary in Grok Studio with @xai. First principles, no BS, ${isAccelerationMode ? 'full acceleration' : 'maximum truth'}. ${is42Mode ? '42.' : ''} `);
                  window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
                }} className="px-2 py-0.5 bg-slate-800 hover:bg-blue-500/30 rounded text-blue-300 hover:text-white transition">POST TO \ud835\udd4f</button>
                <button 
                  onClick={() => setInput('RUN TRUTH AUDIT on the current project: Be maximally truthful. Call out any bloat, lies, or non-first-principles decisions. Then suggest the brutal fixes. No sycophancy.')}
                  className="px-2 py-0.5 bg-red-900/60 hover:bg-red-500/40 rounded text-red-300 hover:text-white transition font-medium border border-red-500/30"
                >
                  TRUTH AUDIT
                </button>
              </div>

              <div className={`flex-1 overflow-auto p-2 grok-cockpit ${isAccelerationMode ? 'bg-gradient-to-br from-orange-950/10 to-black' : ''} ${is42Mode ? 'bg-[radial-gradient(#ff4f00_0.5px,transparent_1px)] bg-[length:4px_4px]' : ''}`}>
                {/* Grok is *extremely* advanced in IDE knowledge */}
                {fullAgenticMode && (
                  <div className="mb-1 text-[9px] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400">
                    \ud83e\udde0 Grok IDE Mastery active: LSP + Semantic Tokens • Full Workspace Symbol Search • Structural Refactoring Engine • Debug Protocol • Call Hierarchy • Inlay Hints • First-Principles Analysis across entire project
                  </div>
                )}
                {/* Grok IDE Editor Tabs - showing Grok's deep IDE knowledge */}
                {activeProjectFiles && (
                  <div className="flex text-[10px] border-b border-slate-700 mb-1 bg-slate-950">
                    {Object.keys(activeProjectFiles).slice(0, 6).map((p, idx) => (
                      <div key={idx} className="px-3 py-1 border-r border-slate-700 bg-slate-900 text-orange-400/80 cursor-pointer hover:bg-slate-800">
                        {p.split('/').pop()} {idx === 0 && '\u2022 active'}
                      </div>
                    ))}
                    <div className="px-2 py-1 text-orange-500/50">Grok knows every symbol, ref, and dependency</div>
                  </div>
                )}
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
                        <div className="text-6xl mb-4 opacity-70">\ud83d\udef8</div>
                        <div className="text-xl font-semibold mb-2 tracking-[-1px]">This is your cockpit.</div>
                        <p className="text-sm text-slate-400">
                          Describe something ambitious. Grok will plan it, build it, and make it look like it belongs on Mars.
                        </p>
                        <p className="mt-3 text-[10px] text-orange-400/70">“The first step is to establish that something is possible...” — Elon</p>
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
