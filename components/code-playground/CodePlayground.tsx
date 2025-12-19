'use client'

import { Sandpack } from '@codesandbox/sandpack-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, Maximize2, Minimize2 } from 'lucide-react'

interface CodePlaygroundProps {
  code: string
  language?: 'tsx' | 'jsx' | 'html'
  showPreview?: boolean
}

export function CodePlayground({
  code,
  language = 'tsx',
  showPreview = true,
}: CodePlaygroundProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `component.${language}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`relative border rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 m-4' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Live Playground
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Sandpack Editor */}
      <Sandpack
        template="react-ts"
        theme="dark"
        files={{
          '/App.tsx': code,
        }}
        options={{
          showNavigator: false,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: isFullscreen ? '85vh' : '500px',
          layout: showPreview ? 'preview' : undefined,
        }}
        customSetup={{
          dependencies: {
            'lucide-react': 'latest',
            '@radix-ui/react-slot': 'latest',
            'class-variance-authority': 'latest',
            clsx: 'latest',
            'tailwind-merge': 'latest',
          },
        }}
      />
    </div>
  )
}
