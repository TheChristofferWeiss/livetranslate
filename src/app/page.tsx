import {
  LiveTranscriber,
  TranscriberControls,
  TranscriberProvider,
  TranslationLanguageSelect,
} from '@/components/transcription/live-transcriber'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen p-8">
      <TranscriberProvider>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TranscriberControls />
            <TranslationLanguageSelect />
            {user ? (
              <div className="flex gap-3">
                <Link
                  href="/dashboard"
                  className="rounded border border-gray-600 px-3 py-1.5 text-sm text-gray-200 hover:border-white"
                >
                  Dashboard
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/login"
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded border border-blue-400 px-3 py-1.5 text-sm text-blue-100 hover:border-blue-200"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>

          <LiveTranscriber />
        </div>
      </TranscriberProvider>
    </main>
  )
}

