'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
} from 'lucide-react'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  content?: string
}

interface FileTreeProps {
  files: Record<string, string>
  currentFile: string
  onFileSelect: (path: string, content: string) => void
}

export function FileTree({ files, currentFile, onFileSelect }: FileTreeProps) {
  const buildTree = (fileMap: Record<string, string>): FileNode[] => {
    const root: FileNode[] = []

    Object.entries(fileMap).forEach(([path, content]) => {
      const parts = path.split('/')
      let current = root

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1
        const currentPath = parts.slice(0, index + 1).join('/')

        let node = current.find((n) => n.name === part)
        if (!node) {
          node = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'folder',
            children: isLast ? undefined : [],
            content: isLast ? content : undefined,
          }
          current.push(node)
        }

        if (!isLast && node.children) {
          current = node.children
        }
      })
    })

    return root.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })
  }

  const tree = buildTree(files)

  return (
    <div className="w-56 shrink-0 bg-slate-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Files
      </div>
      <div className="px-2 pb-4">
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            currentFile={currentFile}
            onFileSelect={onFileSelect}
            level={0}
          />
        ))}
      </div>
    </div>
  )
}

function FileTreeNode({
  node,
  currentFile,
  onFileSelect,
  level,
}: {
  node: FileNode
  currentFile: string
  onFileSelect: (path: string, content: string) => void
  level: number
}) {
  const [expanded, setExpanded] = useState(true)
  const isActive = node.path === currentFile

  if (node.type === 'folder') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full px-2 py-1.5 text-sm hover:bg-slate-200 rounded transition-colors text-left"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="w-4 h-4 text-slate-600 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-slate-600 shrink-0" />
          )}
          <span className="text-slate-700 truncate">{node.name}</span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              currentFile={currentFile}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          ))}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => node.content != null && onFileSelect(node.path, node.content)}
      className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors text-left ${
        isActive
          ? 'bg-slate-200 text-slate-900 font-medium'
          : 'hover:bg-slate-100 text-slate-600'
      }`}
      style={{ paddingLeft: `${level * 12 + 24}px` }}
    >
      <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}
