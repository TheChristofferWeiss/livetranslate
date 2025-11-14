import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { original_text, translated_text, session_id, target_lang } = body ?? {}

  if (!original_text || typeof original_text !== 'string') {
    return NextResponse.json({ error: 'Missing original_text' }, { status: 400 })
  }

  if (!translated_text || typeof translated_text !== 'string') {
    return NextResponse.json({ error: 'Missing translated_text' }, { status: 400 })
  }

  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  if (!target_lang || typeof target_lang !== 'string') {
    return NextResponse.json({ error: 'Missing target_lang' }, { status: 400 })
  }

  const { error } = await (supabase as any).from('archived_transcripts').insert({
    user_id: user.id,
    original_text,
    translated_text,
    session_id,
    target_lang,
  })

  if (error) {
    console.error('Failed to archive transcript', error)
    return NextResponse.json({ error: 'Failed to archive transcript' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

