'use client'

import { useMemo, useState } from 'react'

type ArchiveEntry = {
  id: string
  original_text: string
  translated_text: string
  target_lang: string
  created_at: string
  session_id: string
}

type Props = {
  entries: ArchiveEntry[]
}

export function ArchiveList({ entries }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter(
      (entry) =>
        entry.original_text.toLowerCase().includes(q) ||
        entry.translated_text.toLowerCase().includes(q) ||
        entry.session_id.toLowerCase().includes(q)
    )
  }, [entries, query])

  return (
    <section className="space-y-4">
      <input
        type="search"
        placeholder="Search transcript or translation..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-full border border-gray-700 bg-black/30 px-5 py-2 text-sm text-white placeholder-gray-500 focus:border-white focus:outline-none"
      />

      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500">No matches yet.</p>
        )}

        {filtered.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-gray-800 bg-black/40 p-4 space-y-3"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 uppercase tracking-wide">
              <span>{new Date(entry.created_at).toLocaleString()}</span>
              <span>Session: {entry.session_id}</span>
              <span>Target: {entry.target_lang}</span>
            </header>
            <div>
              <p className="text-xs uppercase text-gray-500">Original</p>
              <p className="text-white">{entry.original_text}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Translation</p>
              <p className="text-white">{entry.translated_text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

