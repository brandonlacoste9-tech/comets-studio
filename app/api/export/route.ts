import { NextRequest, NextResponse } from 'next/server'
import { buildProjectFilesRaw, buildProjectFilesRawFromTemplate } from '@/lib/vercel-deploy'

export async function POST(request: NextRequest) {
  try {
    const { code, files } = await request.json()

    if (files && typeof files === 'object') {
      const fileList = buildProjectFilesRawFromTemplate(files)
      return NextResponse.json({ files: fileList })
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code or files is required' }, { status: 400 })
    }

    const fileList = buildProjectFilesRaw(code.trim())

    return NextResponse.json({ files: fileList })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
