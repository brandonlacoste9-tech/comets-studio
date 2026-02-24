import { ChatInterface } from '@/components/chat/chat-interface'
import { EnvSetup } from '@/components/env-setup'
import { hasEnvVars, checkRequiredEnvVars } from '@/lib/env-check'

export default function Home() {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Only show setup screen in development if environment variables are missing
  if (!hasEnvVars && isDevelopment) {
    const missingVars = checkRequiredEnvVars()
    return <EnvSetup missingVars={missingVars} />
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <ChatInterface />
    </main>
  )
}
