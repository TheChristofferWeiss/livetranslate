import { streamSpeechFromElevenLabs } from '@/lib/elevenlabs/tts'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, voice_id } = body ?? {}

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const audioBuffer = await streamSpeechFromElevenLabs(text, voice_id)

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('TTS request failed', error)
    return NextResponse.json(
      {
        error: 'Text-to-speech failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

