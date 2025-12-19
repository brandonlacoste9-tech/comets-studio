import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getChatOwnership } from '@/lib/db/queries'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await auth()
    const { chatId } = await params

    console.log('Fetching chat details for ID:', chatId)

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      )
    }

    if (session?.user?.id) {
      // Authenticated user - check ownership
      const ownership = await getChatOwnership({ v0ChatId: chatId })

      if (!ownership) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }

      if (ownership.user_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // TODO: Implement chat data fetching from database
    // For now, return a stub response (DeepSeek doesn't have a chats API like v0)
    const chatData = {
      id: chatId,
      title: 'Chat',
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ data: chatData })
  } catch (error) {
    console.error('Chat fetch error:', error)

    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch chat',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await auth()
    const { chatId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Deleting chat:', chatId)

    // Check ownership
    const ownership = await getChatOwnership({ v0ChatId: chatId })

    if (!ownership || ownership.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // TODO: Implement chat deletion from database
    // For now, just return success
    
    console.log('Chat deleted successfully:', chatId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chat deletion error:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete chat',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
