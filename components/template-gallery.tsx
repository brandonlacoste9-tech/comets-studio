'use client'

import React, { useState } from 'react'
import { TEMPLATE_LIST, type Template } from '@/lib/templates'
import { CodePlayground } from '@/components/code-playground/CodePlayground'
import { Copy, X, Layout, Code2, Eye } from 'lucide-react'

interface TemplateGalleryProps {
  onSelect?: (code: string) => void
  onClose?: () => void
}

export function TemplateGallery({ onSelect, onClose }: TemplateGalleryProps) {
  const [selected, setSelected] = useState<Template | null>(null)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview')

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUse = (code: string) => {
    onSelect?.(code)
    onClose?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Templates</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Template list */}
        <div className="w-64 border-r border-gray-200 overflow-y-auto p-2">
          {TEMPLATE_LIST.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                selected?.id === t.id
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{t.description}</div>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {selected ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{selected.name}</span>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setViewMode('code')}
                      className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${viewMode === 'code' ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-600 hover:bg-gray-50'}`}
                    >
                      <Code2 className="w-3.5 h-3.5" /> Code
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${viewMode === 'preview' ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-600 hover:bg-gray-50'}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Live Preview
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(selected.code)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {onSelect && (
                    <button
                      onClick={() => handleUse(selected.code)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Use in Chat
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <CodePlayground
                  code={selected.code}
                  language="tsx"
                  showPreview={viewMode === 'preview'}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a template
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
