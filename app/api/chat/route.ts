import { NextRequest, NextResponse } from 'next/server'
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
import { aiService } from '@/lib/ai-service'
import { GROK_STUDIO_SYSTEM_PROMPT, buildProjectContext } from '@/lib/system-prompt'

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    let session
    try {
      session = await auth()
    } catch {
      session = null
    }
    const { message, chatId, streaming, provider, model, temperature, messages: history, projectFiles } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const requestId = `${chatId || 'anon'}-${Date.now()}`

    // Rate limiting (skip when DB unavailable - personal use)
    try {
      if (process.env.POSTGRES_URL) {
        if (session?.user?.id) {
          const chatCount = await getChatCountByUserId({ userId: session.user.id, differenceInHours: 24 })
          if (chatCount >= entitlementsByUserType[session.user.type].maxMessagesPerDay) {
            return new ChatSDKError('rate_limit:chat').toResponse()
          }
        } else {
          const clientIP = getClientIP(request)
          const chatCount = await getChatCountByIP({ ipAddress: clientIP, differenceInHours: 24 })
          if (chatCount >= anonymousEntitlements.maxMessagesPerDay) {
            return new ChatSDKError('rate_limit:chat').toResponse()
          }
        }
      }
    } catch (dbErr) {
      console.warn('Rate limit check skipped (DB unavailable):', dbErr)
    }

    // Build messages: system prompt + project context + history + new user message
    const recentHistory = Array.isArray(history)
      ? history.filter((m: any) => m.role && m.content).slice(-20).map((m: any) => ({ role: m.role, content: m.content }))
      : []
    const systemContent = GROK_STUDIO_SYSTEM_PROMPT + buildProjectContext(projectFiles)
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemContent },
      ...recentHistory,
      { role: 'user', content: message },
    ]

    if (streaming) {
      const stream = await aiService.streamChatCompletion(messages as any, {
        provider: provider || 'grok',
        model: model,
        temperature: temperature || 0.7,
      })

      const encoder = new TextEncoder()
      const reader = stream.getReader()

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const content = new TextDecoder().decode(value)
              controller.enqueue(encoder.encode(JSON.stringify({ content }) + '\n'))
            }
            controller.close()

            if (process.env.POSTGRES_URL) {
              try {
                if (session?.user?.id) {
                  await createChatOwnership({ v0ChatId: requestId, userId: session.user.id })
                } else {
                  await createAnonymousChatLog({ ipAddress: getClientIP(request), v0ChatId: requestId })
                }
              } catch (logErr) {
                console.warn('Usage log skipped:', logErr)
              }
            }
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Non-streaming fallback (Grok default)
    // but we'll use the service for consistency
    const stream = await aiService.streamChatCompletion(messages as any, {
      provider: provider || 'deepseek',
      model: model,
      temperature: temperature || 0.7,
      stream: false
    })
    
    // Note: The aiService currently only returns a ReadableStream. 
    // In a real scenario, non-streaming would return the full response.
    // For simplicity here, we'll just read the stream if non-streaming is requested.
    const reader = stream.getReader()
    let responseMessage = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      responseMessage += new TextDecoder().decode(value)
    }

    const generatedChatId = chatId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (!chatId && process.env.POSTGRES_URL) {
      try {
        if (session?.user?.id) {
          await createChatOwnership({ v0ChatId: generatedChatId, userId: session.user.id })
        } else {
          await createAnonymousChatLog({ ipAddress: getClientIP(request), v0ChatId: generatedChatId })
        }
      } catch (error) {
        console.error('Failed to create chat ownership/log:', error)
      }
    }

    return NextResponse.json({
      id: generatedChatId,
      messages: [
        { role: 'user', content: message, id: `msg-${Date.now()}-1`, createdAt: new Date().toISOString() },
        { role: 'assistant', content: responseMessage, id: `msg-${Date.now()}-2`, createdAt: new Date().toISOString() }
      ]
    })
  } catch (error) {
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isProviderError = /api|key|401|403|500|ECONNREFUSED|fetch/i.test(message)
    return NextResponse.json({
      error: isProviderError ? `AI provider error: ${message}` : 'Failed to process request',
      details: message
    }, { status: 500 })
  }
}
