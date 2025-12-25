'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChatSelector } from './chat-selector'
import { MobileMenu } from './mobile-menu'
import { useSession } from 'next-auth/react'
import { UserNav } from '@/components/user-nav'
import { Button } from '@/components/ui/button'
import { VercelIcon, GitHubIcon } from '@/components/ui/icons'
import { DEPLOY_URL } from '@/lib/constants'
import { Info, Settings } from 'lucide-react'
import { SettingsPanel } from '@/components/settings-panel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function AppHeader({ className = '' }: AppHeaderProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isHomepage = pathname === '/'
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // ... (handleLogoClick)

  return (
    <div
      className={`${!isHomepage ? 'border-b border-border dark:border-input' : ''} ${className}`}
    >
      {/* ... (SearchParamsHandler) */}
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ... (Logo and Selector) */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
            >
              v0 Clone
            </Link>
            <div className="hidden lg:block">
              <ChatSelector />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
          <Link href="/pricing">
             <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
              💎 Pricing
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="text-slate-300 hover:text-white hover:bg-white/10"
          >
            <Settings className="w-5 h-5" />
          </Button>
            
            <Button
              variant="outline"
              className="py-1.5 px-2 h-fit text-sm"
              onClick={() => setIsInfoDialogOpen(true)}
            >
              <Info size={16} />
              What's This?
            </Button>
            {/* ... (GitHub Button, Deploy Button, UserNav) */}
             <Button
              variant="outline"
              className="py-1.5 px-2 h-fit text-sm"
              asChild
            >
              <Link
                href="https://github.com/vercel/v0-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon size={16} />
                vercel/v0-sdk
              </Link>
            </Button>

            <Button
              className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 py-1.5 px-2 h-fit text-sm"
              asChild
            >
              <Link href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
                <VercelIcon size={16} />
                Deploy with Vercel
              </Link>
            </Button>
            <UserNav session={session} />
          </div>

          <div className="flex lg:hidden items-center gap-2">
             <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <UserNav session={session} />
            <MobileMenu onInfoDialogOpen={() => setIsInfoDialogOpen(true)} />
          </div>
        </div>
      </div>

      <SettingsPanel open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        {/* ... (Info Dialog content) */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4">
              v0 Clone Platform
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              This is a <strong>demo</strong> of a{' '}
              <a
                href="https://v0.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                v0 clone
              </a>{' '}
              where users can enter text prompts and generate React components
              and applications using AI.
            </p>
             <p>
              It's built with{' '}
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Next.js
              </a>{' '}
              and the{' '}
              <a
                href="https://v0-sdk.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                v0 SDK
              </a>{' '}
              to provide a full-featured interface with authentication, database
              integration, and real-time streaming responses.
            </p>
            <p>
              Try the demo or{' '}
              <a
                href={DEPLOY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                deploy your own
              </a>
              .
            </p>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setIsInfoDialogOpen(false)}
              className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              Try now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
