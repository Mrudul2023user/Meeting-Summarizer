import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

const gatewayUrl = 'https://ai-gateway.vercel.sh/v1/audio/transcriptions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 })
    }

    const transcription = new FormData()
    transcription.append('file', file, file.name)
    transcription.append('model', 'openai/gpt-4o-mini-transcribe')
    transcription.append('response_format', 'text')

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` },
      body: transcription,
    })
    if (!response.ok) {
      const detail = await response.text()
      console.error('[v0] transcription failed', response.status, detail)
      return NextResponse.json({ error: 'The audio could not be transcribed.' }, { status: 502 })
    }

    const transcript = (await response.text()).trim()
    if (!transcript) return NextResponse.json({ error: 'No speech was detected in this file.' }, { status: 422 })

    const { text: summary } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: 'You summarize meeting transcripts accurately. Never invent facts, names, dates, decisions, or action items. Write a detailed, readable meeting summary in several paragraphs. Include context, key discussion points, decisions, open questions, and next steps only when supported by the transcript.',
      prompt: `Create a detailed meeting summary from this transcript. Use plain text with paragraph breaks and no markdown headings.\n\nTRANSCRIPT:\n${transcript}`,
      maxOutputTokens: 1200,
    })

    return NextResponse.json({ transcript, summary })
  } catch (error) {
    console.error('[v0] summarize failed', error)
    return NextResponse.json({ error: 'Meeting analysis failed. Please try again.' }, { status: 500 })
  }
}
