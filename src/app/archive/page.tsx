import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArchiveList } from '@/components/archive/archive-list'

export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: entries, error } = await supabase
    .from('archived_transcripts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <p className="text-sm uppercase tracking-wide text-gray-500">LiveTranslate</p>
          <h1 className="text-3xl font-semibold text-white">Archive</h1>
          <p className="text-gray-400">
            Review previously captured transcript segments and their translations.
          </p>
        </header>

        <ArchiveList entries={entries ?? []} />
      </div>
    </main>
  )
}

