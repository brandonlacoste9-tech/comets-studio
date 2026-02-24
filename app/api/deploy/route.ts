import { NextRequest, NextResponse } from 'next/server'
import { deployToVercel, deployToVercelFromTemplate } from '@/lib/vercel-deploy'

export async function POST(request: NextRequest) {
  try {
    const { code, files, name } = await request.json()

    if (files && typeof files === 'object') {
      const result = await deployToVercelFromTemplate(files, name)
      return NextResponse.json({
        url: result.url,
        id: result.id,
        status: result.status,
        message: 'Deployment started. The site may take 1-2 minutes to build.',
      })
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code or files is required' }, { status: 400 })
    }

    const result = await deployToVercel(code, name)

    return NextResponse.json({
      url: result.url,
      id: result.id,
      status: result.status,
      message: 'Deployment started. The site may take 1-2 minutes to build.',
    })
  } catch (error) {
    console.error('Deploy error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Deployment failed',
      },
      { status: 500 }
    )
  }
}
