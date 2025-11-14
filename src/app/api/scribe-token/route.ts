import { NextResponse } from 'next/server'

const ELEVENLABS_TOKEN_URL =
  'https://api.elevenlabs.io/v1/single-use-token/realtime_scribe'

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY is not configured' },
      { status: 500 }
    )
  }

  const response = await fetch(ELEVENLABS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    return NextResponse.json(
      { error: 'Failed to generate Scribe token', details: errorText },
      { status: response.status }
    )
  }

  const data = await response.json()

  if (!data?.token) {
    return NextResponse.json(
      { error: 'Token missing in ElevenLabs response' },
      { status: 502 }
    )
  }

  return NextResponse.json({ token: data.token }, { headers: { 'cache-control': 'no-store' } })
}

