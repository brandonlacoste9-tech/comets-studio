'use client'

import { Sandpack, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, Maximize2, Minimize2, Rocket, FileArchive } from 'lucide-react'
import { FileTree } from '@/components/file-tree'

/** Tailwind CDN for preview - enables Tailwind classes in generated components */
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Preview</title>
</head>
<body class="m-0 p-4 min-h-screen bg-slate-50">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`

const MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);`

/** Build Sandpack files from projectFiles - preview imports app/page.tsx */
function buildSandpackFilesFromProject(
  projectFiles: Record<string, string>,
  mainFile: string
): Record<string, { code: string; hidden?: boolean }> {
  const mainContent = projectFiles[mainFile] ?? ''
  const mainTsx = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "/app/page.tsx";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);`
  const files: Record<string, { code: string; hidden?: boolean }> = {
    '/index.html': { code: INDEX_HTML, hidden: true },
    '/src/main.tsx': { code: mainTsx, hidden: true },
    '/app/page.tsx': { code: mainContent },
  }
  Object.entries(projectFiles).forEach(([path, content]) => {
    const key = path.startsWith('/') ? path : `/${path}`
    if (key !== '/app/page.tsx' && key !== '/index.html' && key !== '/src/main.tsx') {
      files[key] = { code: content }
    }
  })
  return files
}

/** Project mode: FileTree + Sandpack with multi-file support */
function ProjectEditor({
  projectFiles,
  mainFile,
  currentFile,
  onCurrentFileChange,
  onProjectFilesChange,
  showPreview,
  isFullscreen,
}: {
  projectFiles: Record<string, string>
  mainFile: string
  currentFile: string
  onCurrentFileChange: (path: string) => void
  onProjectFilesChange?: (files: Record<string, string>) => void
  showPreview: boolean
  isFullscreen: boolean
}) {
  const sandpackFiles = buildSandpackFilesFromProject(projectFiles, mainFile)
  const activeFile = currentFile.startsWith('/') ? currentFile : `/${currentFile}`

  const handleFileSelect = useCallback(
    (path: string, _content: string) => {
      onCurrentFileChange(path)
    },
    [onCurrentFileChange]
  )

  return (
    <>
      <FileTree
        files={projectFiles}
        currentFile={currentFile}
        onFileSelect={handleFileSelect}
      />
      <div className="flex-1 min-w-0">
        <SandpackProvider
          template="react-ts"
          theme="light"
          files={sandpackFiles}
          options={{
            activeFile: activeFile as string,
            showTabs: true,
            showLineNumbers: true,
            showInlineErrors: true,
            wrapContent: true,
            editorHeight: isFullscreen ? '85vh' : '400px',
            layout: showPreview ? 'preview' : undefined,
          }}
          customSetup={{
            dependencies: { 'lucide-react': 'latest' },
          }}
        >
          <SandpackFileSync
            projectFiles={projectFiles}
            onProjectFilesChange={onProjectFilesChange}
          />
          <Sandpack
            template="react-ts"
            theme="light"
            options={{
              activeFile: activeFile as string,
              showTabs: true,
              showLineNumbers: true,
              showInlineErrors: true,
              wrapContent: true,
              editorHeight: isFullscreen ? '85vh' : '400px',
              layout: showPreview ? 'preview' : undefined,
            }}
            customSetup={{
              dependencies: { 'lucide-react': 'latest' },
            }}
          />
        </SandpackProvider>
      </div>
    </>
  )
}

/** Syncs Sandpack file edits back to projectFiles (debounced) */
function SandpackFileSync({
  projectFiles,
  onProjectFilesChange,
}: {
  projectFiles: Record<string, string>
  onProjectFilesChange?: (files: Record<string, string>) => void
}) {
  const { sandpack } = useSandpack()

  useEffect(() => {
    if (!onProjectFilesChange || !sandpack?.files) return
    const timer = setTimeout(() => {
      const raw = sandpack.files as Record<string, { code?: string }>
      const updated: Record<string, string> = {}
      Object.entries(raw).forEach(([path, file]) => {
        const cleanPath = path.replace(/^\//, '')
        if (cleanPath && file?.code != null && !path.startsWith('/src/main') && path !== '/index.html') {
          updated[cleanPath] = file.code
        }
      })
      if (Object.keys(updated).length > 0) {
        const merged = { ...projectFiles, ...updated }
        if (JSON.stringify(merged) !== JSON.stringify(projectFiles)) {
          onProjectFilesChange(merged)
        }
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [sandpack?.files, onProjectFilesChange, projectFiles])

  return null
}

function loadJSZip(): Promise<{ new (): { file: (n: string, c: string) => void; generateAsync: (o: { type: string }) => Promise<Blob> } }> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'))
  const w = window as Window & { JSZip?: unknown }
  if (w.JSZip) return Promise.resolve(w.JSZip as never)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
    script.onload = () => resolve(w.JSZip as never)
    script.onerror = () => reject(new Error('Failed to load JSZip'))
    document.head.appendChild(script)
  })
}

interface CodePlaygroundProps {
  code: string
  language?: 'tsx' | 'jsx' | 'html'
  showPreview?: boolean
  /** Full project files for deploy/export (e.g. from template) */
  projectFiles?: Record<string, string>
  /** Main file for preview (e.g. app/page.tsx) */
  mainFile?: string
  /** Called when project files change (e.g. after edit or file switch) */
  onProjectFilesChange?: (files: Record<string, string>) => void
}

export function CodePlayground({
  code,
  language = 'tsx',
  showPreview = true,
  projectFiles,
  mainFile = 'app/page.tsx',
  onProjectFilesChange,
}: CodePlaygroundProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentFile, setCurrentFile] = useState(mainFile)
  const isProjectMode = projectFiles && Object.keys(projectFiles).length > 1
  const [copied, setCopied] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExportZip = async () => {
    setExporting(true)
    setDeployError(null)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectFiles ? { files: projectFiles } : { code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Export failed')
      const { files } = data as { files: Array<{ file: string; content: string }> }
      const JSZip = await loadJSZip()
      const zip = new JSZip()
      for (const { file, content } of files) {
        zip.file(file, content)
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comets-project-${Date.now().toString(36)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
      setDeployError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

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

  const handleDeploy = async () => {
    setDeploying(true)
    setDeployError(null)
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectFiles ? { files: projectFiles } : { code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Deploy failed')
      if (data.url) window.open(data.url, '_blank')
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div
      className={`relative border rounded-lg overflow-hidden border-gray-200 bg-white shadow-sm ${
        isFullscreen ? 'fixed inset-0 z-50 m-4' : ''
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-gray-200">
        <span className="text-sm font-medium text-slate-700">
          Live Preview
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-slate-600 hover:bg-gray-100"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 text-slate-600 hover:bg-gray-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportZip}
            disabled={exporting}
            className="h-8 text-slate-600 hover:bg-gray-100 disabled:opacity-50"
            title="Export project as ZIP (Replit-ready)"
          >
            <FileArchive className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export ZIP'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeploy}
            disabled={deploying}
            className="h-8 text-slate-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {deploying ? 'Deploying...' : 'Deploy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 text-slate-600 hover:bg-gray-100"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {deployError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-sm text-red-700">
          {deployError}
        </div>
      )}

      {/* Editor + Preview */}
      <div className="flex min-h-0">
        {isProjectMode ? (
          <ProjectEditor
            projectFiles={projectFiles!}
            mainFile={mainFile}
            currentFile={currentFile}
            onCurrentFileChange={setCurrentFile}
            onProjectFilesChange={onProjectFilesChange}
            showPreview={showPreview}
            isFullscreen={isFullscreen}
          />
        ) : (
          <Sandpack
            template="react-ts"
            theme="light"
            files={{
              '/index.html': { code: INDEX_HTML, hidden: true },
              '/src/main.tsx': { code: MAIN_TSX, hidden: true },
              '/App.tsx': code,
            }}
            options={{
              showNavigator: false,
              showTabs: true,
              showLineNumbers: true,
              showInlineErrors: true,
              wrapContent: true,
              editorHeight: isFullscreen ? '85vh' : '400px',
              layout: showPreview ? 'preview' : undefined,
            }}
            customSetup={{
              dependencies: {
                'lucide-react': 'latest',
              },
            }}
          />
        )}
      </div>
    </div>
  )
}
