import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Audio file required' }, { status: 400 })
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) return NextResponse.json({ error: 'Upload an audio or video file' }, { status: 415 })
    if (file.size > 250 * 1024 * 1024) return NextResponse.json({ error: 'File must be smaller than 250 MB' }, { status: 413 })
    const blob = await put(`meetings/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`, file, { access: 'private' })
    return NextResponse.json({ pathname: blob.pathname, contentType: file.type, size: file.size })
  } catch (error) {
    console.error('[v0] upload failed', error)
    return NextResponse.json({ error: 'Upload failed. Check Blob configuration and try again.' }, { status: 500 })
  }
}
export const runtime = 'nodejs'
export const maxDuration = 60
