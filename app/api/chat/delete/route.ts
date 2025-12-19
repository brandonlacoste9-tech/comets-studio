import { NextRequest, NextResponse } from 'next/server'

// NOTE: This endpoint is deprecated without v0-sdk
// Chat deletion should be handled through /api/chats/[chatId] DELETE endpoint
export async function POST(request: NextRequest) {
  try {
    const { chatId } = await request.json()

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      )
    }

    // TODO: Implement chat deletion from database
    // For now, return success (DeepSeek doesn't have a chats API like v0)
    console.log('Chat deletion requested:', chatId)
    
    return NextResponse.json({ success: true, chatId })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 },
    )
  }
}
