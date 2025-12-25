import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/app/(auth)/auth'
import {
  createChatOwnership,
  createAnonymousChatLog,
  getChatCountByUserId,
  getChatCountByIP,
} from '@/lib/db/queries'
import {
  entitlementsByUserType,
  anonymousEntitlements,
} from '@/lib/entitlements'
import { ChatSDKError } from '@/lib/errors'


function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Perplexity client
    const perplexity = new OpenAI({
      baseURL: 'https://api.perplexity.ai',
      apiKey: process.env.PERPLEXITY_API_KEY || 'placeholder',
    })

    const session = await auth()
    const { message, chatId, streaming, temperature, maxTokens, language, artisteMode } = await request.json()
    
    // ... validation

    // Dynamic System Prompt
    let systemPrompt = 'You are an expert UI/UX designer and full-stack developer. Generate clean, modern React components using Tailwind CSS and Next.js best practices.'

    if (artisteMode) {
      systemPrompt += `
      
      🎨 AI ARTISTE MODE ACTIVATED:
      - You are a world-class creative technologist.
      - PRIORITY: VISUAL AESTHETICS & ANIMATION.
      - Use "Glassmorphism" (backdrop-blur, white/10 borders), "Neumorphism", or "Aurora Gradients".
      - ALWAYS use 'lucide-react' for icons.
      - ALWAYS use 'framer-motion' for animations if appropriate.
      - When asked to build a specific component (like a "Landing Page" or "Dashboard"), generate a COMPLETE, SINGLE-FILE React component that can run in a Sandpack preview.
      - The user can see your code running LIVE. Make it pop!
      `
    }
    
    if (language === 'fr-QC') {
      systemPrompt += " \n\nIMPORTANT: Tu es Québécois. Utilise des expressions québécoises authentiques (ex: 'C'est tiguidou', 'Aweille', 'Jaser de code'). Sois amical, professionnel mais avec une bonne touche locale."
    }

    const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }]

    const modelObj = {
      model: 'llama-3.1-sonar-large-128k-online',
      messages: messages as any,
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1000, // Perplexity limit is flexible
      stream: streaming || false,
    }

    if (streaming) {
      const stream = await perplexity.chat.completions.create({ ...modelObj, stream: true })
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) controller.enqueue(encoder.encode(JSON.stringify({ content }) + '\n'))
            }
            controller.close()
          } catch (error) { controller.error(error) }
        }
      })
      return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
    }

    const completion = await perplexity.chat.completions.create({ ...modelObj, stream: false })
    const responseMessage = completion.choices[0]?.message?.content || ''
    
    const generatedChatId = chatId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (!chatId) {
      try {
        if (session?.user?.id) {
          await createChatOwnership({ v0ChatId: generatedChatId, userId: session.user.id })
        } else {
          await createAnonymousChatLog({ ipAddress: getClientIP(request), v0ChatId: generatedChatId })
        }
      } catch (error) { console.error('Failed to create chat ownership/log:', error) }
    }

    return NextResponse.json({ 
      id: generatedChatId, 
      messages: [
        { role: 'user', content: message, id: `msg-${Date.now()}-1`, createdAt: new Date().toISOString() }, 
        { role: 'assistant', content: responseMessage, id: `msg-${Date.now()}-2`, createdAt: new Date().toISOString() }
      ] 
    })

  } catch (error) {
    console.error('Perplexity API Error:', error)
    return NextResponse.json({ error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
