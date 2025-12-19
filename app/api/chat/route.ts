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

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
})

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
    const { message, chatId, streaming } = await request.json()
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
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
    const systemPrompt = 'You are an expert UI/UX designer and full-stack developer. Generate clean, modern React components using Tailwind CSS and Next.js best practices.'
    const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }]
    if (streaming) {
      const stream = await deepseek.chat.completions.create({ model: 'deepseek-chat', messages: messages as any, stream: true, temperature: 0.7, max_tokens: 4096 })
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({ async start(controller) { try { for await (const chunk of stream) { const content = chunk.choices[0]?.delta?.content || ''; if (content) controller.enqueue(encoder.encode(JSON.stringify({ content }) + '\n')) } controller.close() } catch (error) { controller.error(error) } } })
      return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
    }
    const completion = await deepseek.chat.completions.create({ model: 'deepseek-chat', messages: messages as any, temperature: 0.7, max_tokens: 4096 })
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
    return NextResponse.json({ id: generatedChatId, messages: [{ role: 'user', content: message, id: `msg-${Date.now()}-1`, createdAt: new Date().toISOString() }, { role: 'assistant', content: responseMessage, id: `msg-${Date.now()}-2`, createdAt: new Date().toISOString() }] })
  } catch (error) {
    console.error('DeepSeek API Error:', error)
    return NextResponse.json({ error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
