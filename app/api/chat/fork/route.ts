import { NextRequest, NextResponse } from 'next/server'

// NOTE: This endpoint is deprecated without v0-sdk
// Chat forking should be handled through client-side duplication

export async function POST(request: NextRequest) {
  try {
    const { chatId } = await request.json()

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      )
    }

    // TODO: Implement chat forking in database
    // For now, return success (DeepSeek doesn't have a chats API like v0)
    console.log('Chat fork requested:', chatId)

    return NextResponse.json({ success: true, chatId })
  } catch (error) {
    console.error('Error forking chat:', error)
    return NextResponse.json({ error: 'Failed to fork chat' }, { status: 500 })
  }
}
