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
import { COMETS_STUDIO_SYSTEM_PROMPT } from '@/lib/system-prompt'

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const { message, chatId, streaming, provider, model, temperature, messages: history } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build messages: system prompt + conversation history (last 20 msgs) + new user message
    const recentHistory = Array.isArray(history)
      ? history.filter((m: any) => m.role && m.content).slice(-20).map((m: any) => ({ role: m.role, content: m.content }))
      : []
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: COMETS_STUDIO_SYSTEM_PROMPT },
      ...recentHistory,
      { role: 'user', content: message },
    ]

    // Rate limiting check
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

    if (streaming) {
      const stream = await aiService.streamChatCompletion(messages as any, {
        provider: provider || 'deepseek',
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

    // Non-streaming fallback (using deepseek by default for now as per original code logic)
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
    
    if (!chatId) {
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
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
