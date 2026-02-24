'use client'

import React from 'react'
import { PROJECT_TEMPLATES, PROJECT_TEMPLATE_IDS, type ProjectTemplate } from '@/lib/project-templates'
import { X, FolderPlus } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (templateKey: string, template: ProjectTemplate) => void
}

export function NewProjectDialog({ open, onOpenChange, onSelect }: NewProjectDialogProps) {
  const handleSelect = (key: string) => {
    const template = PROJECT_TEMPLATES[key]
    if (template) {
      onSelect(key, template)
      onOpenChange(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-gray-200 bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-slate-600" />
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                New Project
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6">
            <Dialog.Description className="sr-only">
              Choose a project template to get started
            </Dialog.Description>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROJECT_TEMPLATE_IDS.map((key) => {
                const template = PROJECT_TEMPLATES[key]
                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  >
                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {Object.keys(template.files).length} files
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
