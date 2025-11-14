create table if not exists public.archived_transcripts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete cascade not null,
  session_id text not null,
  target_lang text not null,
  original_text text not null,
  translated_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists archived_transcripts_user_created_idx
  on public.archived_transcripts (user_id, created_at desc);

