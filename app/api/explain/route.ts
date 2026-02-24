import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai-service'

/**
 * Explain code in plain language.
 * Uses the same AI providers as chat (Ollama, DeepSeek, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const { code, language = 'tsx', provider = 'ollama', model } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const systemPrompt = `You are a patient coding tutor. Explain the provided code in clear, concise plain English.
- Describe what the code does (purpose and behavior)
- Highlight key patterns, hooks, or logic
- Keep it under 150 words unless the code is complex
- No code blocks in your response - just prose`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ]

    const stream = await aiService.streamChatCompletion(messages, {
      provider: provider || 'ollama',
      model,
      temperature: 0.3,
      stream: true,
    })

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fullResponse += decoder.decode(value)
    }

    return NextResponse.json({ explanation: fullResponse.trim() })
  } catch (error) {
    console.error('Explain error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to explain code' },
      { status: 500 }
    )
  }
}
