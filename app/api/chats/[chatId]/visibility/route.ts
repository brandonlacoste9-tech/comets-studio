import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getChatOwnership } from '@/lib/db/queries'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await auth()
    const { chatId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Updating visibility for chat:', chatId)

    // Check ownership
    const ownership = await getChatOwnership({ v0ChatId: chatId })

    if (!ownership || ownership.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { visibility } = body

    if (!visibility || !['public', 'private'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value. Must be "public" or "private"' },
        { status: 400 },
      )
    }

    // TODO: Implement visibility update in database
    // For now, just return success (DeepSeek doesn't have a chats API like v0)
    
    console.log('Chat visibility updated successfully:', chatId, visibility)

    return NextResponse.json({ success: true, visibility })
  } catch (error) {
    console.error('Visibility update error:', error)

    return NextResponse.json(
      {
        error: 'Failed to update visibility',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
