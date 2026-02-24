import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { StreamingProvider } from '@/contexts/streaming-context'
import { SWRProvider } from '@/components/providers/swr-provider'
import { SessionProvider } from '@/components/providers/session-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'v0 Clone',
  description:
    'A clone of v0.dev built with the v0 SDK - Generate and preview React components with AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = null;
                try { stored = JSON.parse(localStorage.getItem('comets-theme') || '{}'); } catch(e) {}
                var theme = stored?.state?.theme || 'system';
                function apply() {
                  if (theme === 'dark') document.documentElement.classList.add('dark');
                  else if (theme === 'light') document.documentElement.classList.remove('dark');
                  else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                  }
                }
                apply();
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() { if (theme === 'system') apply(); });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <SWRProvider>
            <StreamingProvider>{children}</StreamingProvider>
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
