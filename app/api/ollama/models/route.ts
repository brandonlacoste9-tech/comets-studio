import { NextResponse } from 'next/server'

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_BASE.replace(/\/v1$/, '')}/api/tags`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Ollama not reachable', models: [] },
        { status: 502 }
      )
    }

    const data = await res.json()
    const models = (data.models || []).map((m: { name: string }) => m.name)

    return NextResponse.json({ models })
  } catch (error) {
    console.error('Ollama models fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Ollama models', models: [] },
      { status: 500 }
    )
  }
}
