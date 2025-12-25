'use client';

import React, { memo, useState } from 'react';
import { Check, Copy, Zap } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageItemProps {
  message: {
    id: string;
    role: string;
    content: string;
    isStreaming?: boolean;
    provider?: string;
  };
}

export const MessageItem = memo(({ message }: MessageItemProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    <div
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
            {message.role === 'user' ? 'You' : `Comet (Perplexity)`}
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
  );
}, (prevProps, nextProps) => {
  // Custom comparison to ensure streaming messages update, but others don't
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming &&
    prevProps.message.role === nextProps.message.role
  );
});

MessageItem.displayName = 'MessageItem';
