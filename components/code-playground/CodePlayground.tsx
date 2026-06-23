'use client'

import { Sandpack, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, Maximize2, Minimize2, Rocket, FileArchive } from 'lucide-react'
import { FileTree } from '@/components/file-tree'

// ... full content with Grok IDE updates, dark theme, etc.

export function CodePlayground({ ... }) {
  // ... 
  return (
    <div className={`relative border rounded-xl overflow-hidden border-slate-800 bg-black ...`}>
      {/* Toolbar with GROK EDITOR */}
      {/* ... */}
    </div>
  )
}
