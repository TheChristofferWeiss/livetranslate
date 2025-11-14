import { translateWithDeepL } from '@/lib/deepl/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, target_lang, source_lang } = body ?? {}

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    if (!target_lang || typeof target_lang !== 'string') {
      return NextResponse.json({ error: 'Missing target_lang' }, { status: 400 })
    }

    const translation = await translateWithDeepL({
      text,
      target_lang,
      source_lang,
    })

    return NextResponse.json({
      text,
      translated_text: translation.text,
      detected_source_language: translation.detected_source_language,
      target_lang: target_lang.toUpperCase(),
    })
  } catch (error) {
    console.error('DeepL translation failed', error)
    return NextResponse.json(
      {
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

