'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { EnvSetup } from '@/components/env-setup'
import { hasEnvVars, checkRequiredEnvVars } from '@/lib/env-check'
import { SandpackPreview } from '@/components/preview/sandpack-preview'
import { useSettings } from '@/lib/store/settings'
import { AnimatePresence, motion } from 'framer-motion'

export default function Home() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const { artisteMode } = useSettings()

  // Only show setup screen in development if environment variables are missing
  if (!hasEnvVars && isDevelopment) {
    const missingVars = checkRequiredEnvVars()
    return <EnvSetup missingVars={missingVars} />
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      <div className="flex h-screen">
        {/* Chat Area */}
        <div className={`transition-all duration-500 ease-in-out ${artisteMode ? 'w-1/2 border-r border-white/10' : 'w-full'}`}>
          <ChatInterface />
        </div>

        {/* Preview Area (Artiste Mode) */}
        <AnimatePresence>
          {artisteMode && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="h-full bg-slate-950 p-4"
            >
              <SandpackPreview />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
