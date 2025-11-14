'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useScribe } from '@elevenlabs/react'

const MODEL_ID = 'scribe_v2_realtime'
const ARCHIVE_LENGTH_TRIGGER = 140

const TRANSLATION_LANGUAGES = [
  { code: 'BG', label: 'Bulgarian' },
  { code: 'CS', label: 'Czech' },
  { code: 'DA', label: 'Danish' },
  { code: 'DE', label: 'German' },
  { code: 'EL', label: 'Greek' },
  { code: 'EN', label: 'English (auto variant)' },
  { code: 'EN-GB', label: 'English (UK)' },
  { code: 'EN-US', label: 'English (US)' },
  { code: 'ES', label: 'Spanish' },
  { code: 'ET', label: 'Estonian' },
  { code: 'FI', label: 'Finnish' },
  { code: 'FR', label: 'French' },
  { code: 'HU', label: 'Hungarian' },
  { code: 'ID', label: 'Indonesian' },
  { code: 'IT', label: 'Italian' },
  { code: 'JA', label: 'Japanese' },
  { code: 'KO', label: 'Korean' },
  { code: 'LT', label: 'Lithuanian' },
  { code: 'LV', label: 'Latvian' },
  { code: 'NB', label: 'Norwegian (Bokmål)' },
  { code: 'NL', label: 'Dutch' },
  { code: 'PL', label: 'Polish' },
  { code: 'PT-BR', label: 'Portuguese (Brazil)' },
  { code: 'PT-PT', label: 'Portuguese (Portugal)' },
  { code: 'RO', label: 'Romanian' },
  { code: 'RU', label: 'Russian' },
  { code: 'SK', label: 'Slovak' },
  { code: 'SL', label: 'Slovenian' },
  { code: 'SV', label: 'Swedish' },
  { code: 'TR', label: 'Turkish' },
  { code: 'UK', label: 'Ukrainian' },
  { code: 'ZH', label: 'Chinese' },
] as const

type TranscriberContextValue = {
  start: () => Promise<void>
  stop: () => Promise<void>
  isConnected: boolean
  isRequestingToken: boolean
  partialTranscript: string
  error: string | null
  targetLang: string
  setTargetLang: (lang: string) => void
  translatedText: string
  isTranslating: boolean
  translationError: string | null
  speakTranslation: () => Promise<void>
  isSpeaking: boolean
  speechUrl: string | null
  speechError: string | null
  archiveError: string | null
}

const TranscriberContext = createContext<TranscriberContextValue | undefined>(undefined)

function useTranscriberContext() {
  const ctx = useContext(TranscriberContext)
  if (!ctx) {
    throw new Error('Transcriber context must be used within TranscriberProvider')
  }
  return ctx
}

export function TranscriberProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null)
  const [isRequestingToken, setIsRequestingToken] = useState(false)
  const [targetLang, setTargetLang] = useState<string>('ES')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechUrl, setSpeechUrl] = useState<string | null>(null)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const sessionId = useMemo(() => crypto.randomUUID(), [])
  const isArchivingRef = useRef(false)

  const scribe = useScribe({
    modelId: MODEL_ID,
    onPartialTranscript: () => setError(null),
    onCommittedTranscript: () => setError(null),
    onError: (err) => {
      if (err instanceof Error) {
        setError(err.message)
        return
      }
      setError('Unexpected transcription error')
    },
  })

  const fetchToken = useCallback(async () => {
    const response = await fetch('/api/scribe-token', {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to obtain Scribe token')
    }

    const { token } = (await response.json()) as { token: string }

    if (!token) {
      throw new Error('Token missing from server response')
    }

    return token
  }, [])

  const start = useCallback(async () => {
    try {
      setError(null)
      setIsRequestingToken(true)
      const token = await fetchToken()

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsRequestingToken(false)
    }
  }, [fetchToken, scribe])

  const stop = useCallback(async () => {
    try {
      await scribe.disconnect()
    } catch (err) {
      setError((err as Error).message)
    }
  }, [scribe])

  useEffect(() => {
    if (!scribe.partialTranscript?.trim()) {
      setTranslatedText('')
      setIsTranslating(false)
      setTranslationError(null)
      setSpeechError(null)
      setArchiveError(null)
      setSpeechUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
      return
    }

    let cancelled = false
    const controller = new AbortController()
    setIsTranslating(true)
    setTranslationError(null)

    const debounce = setTimeout(async () => {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: scribe.partialTranscript,
            target_lang: targetLang,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Translation failed')
        }

        const data = await response.json()

        if (!cancelled) {
          setTranslatedText(data.translated_text)
          setIsTranslating(false)
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted) return

        setTranslationError((err as Error).message)
        setIsTranslating(false)
      }
    }, 500)

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(debounce)
    }
  }, [scribe.partialTranscript, targetLang])

  useEffect(
    () => () => {
      if (speechUrl) {
        URL.revokeObjectURL(speechUrl)
      }
    },
    [speechUrl]
  )

  const archiveCurrentSegment = useCallback(async () => {
    if (isArchivingRef.current) {
      return
    }
    const original = scribe.partialTranscript?.trim()
    const translated = translatedText.trim()

    if (!original || !translated) {
      return
    }

    isArchivingRef.current = true
    setArchiveError(null)

    try {
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_text: original,
          translated_text: translated,
          session_id: sessionId,
          target_lang: targetLang,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to archive transcript')
      }

      setTranslatedText('')
      setSpeechUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })

      await scribe.commit?.()
    } catch (err) {
      setArchiveError((err as Error).message)
    } finally {
      isArchivingRef.current = false
    }
  }, [scribe, translatedText, sessionId, targetLang])

  useEffect(() => {
    if (
      !translatedText.trim() ||
      !scribe.partialTranscript?.trim() ||
      scribe.partialTranscript.length < ARCHIVE_LENGTH_TRIGGER
    ) {
      return
    }

    archiveCurrentSegment()
  }, [archiveCurrentSegment, scribe.partialTranscript, translatedText])

  const speakTranslation = useCallback(async () => {
    if (!translatedText) {
      return
    }

    try {
      setSpeechError(null)
      setIsSpeaking(true)

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: translatedText }),
      })

      if (!response.ok) {
        throw new Error('Text-to-speech request failed')
      }

      const arrayBuffer = await response.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })

      setSpeechUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return URL.createObjectURL(blob)
      })
    } catch (err) {
      setSpeechError((err as Error).message)
    } finally {
      setIsSpeaking(false)
    }
  }, [translatedText])

  const value = useMemo(
    () => ({
      start,
      stop,
      isConnected: scribe.isConnected,
      isRequestingToken,
      partialTranscript: scribe.partialTranscript,
      error,
      targetLang,
      setTargetLang,
      translatedText,
      isTranslating,
      translationError,
      speakTranslation,
      isSpeaking,
      speechUrl,
      speechError,
      archiveError,
    }),
    [
      start,
      stop,
      scribe.isConnected,
      isRequestingToken,
      scribe.partialTranscript,
      error,
      targetLang,
      translatedText,
      isTranslating,
      translationError,
      speakTranslation,
      isSpeaking,
      speechUrl,
      speechError,
      archiveError,
    ]
  )

  return <TranscriberContext.Provider value={value}>{children}</TranscriberContext.Provider>
}

export function TranscriberControls() {
  const { start, stop, isConnected, isRequestingToken } = useTranscriberContext()

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={start}
        disabled={isConnected || isRequestingToken}
        className="rounded-full border border-white px-5 py-2 text-sm font-semibold text-black bg-white disabled:bg-transparent disabled:text-white disabled:border-gray-600"
      >
        {isConnected ? 'Streaming' : isRequestingToken ? 'Connecting…' : 'Start'}
      </button>
      <button
        type="button"
        onClick={stop}
        disabled={!isConnected}
        className="rounded-full border border-red-400 px-5 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:border-gray-700 disabled:text-gray-500"
      >
        Stop
      </button>
    </div>
  )
}

export function TranslationLanguageSelect() {
  const { targetLang, setTargetLang } = useTranscriberContext()

  return (
    <label className="flex items-center gap-2 text-sm text-gray-300">
      <span className="uppercase tracking-wide text-xs text-gray-500">Translate to</span>
      <select
        value={targetLang}
        onChange={(event) => setTargetLang(event.target.value)}
        className="rounded-full border border-gray-700 bg-black/40 px-3 py-1 text-sm text-white focus:border-white focus:outline-none"
      >
        {TRANSLATION_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function LiveTranscriber() {
  const {
    partialTranscript,
    translatedText,
    error,
    isTranslating,
    translationError,
    speakTranslation,
    isSpeaking,
    speechUrl,
    speechError,
    archiveError,
  } = useTranscriberContext()

  return (
    <section className="rounded-2xl border border-gray-800 bg-black p-6 text-white space-y-4">
      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="min-h-[220px] rounded-xl bg-black p-4 text-base leading-relaxed text-white">
        {partialTranscript || 'Waiting for audio…'}
      </div>

      <div className="min-h-[160px] rounded-xl bg-black/60 p-4 text-base leading-relaxed text-white border border-gray-800">
        {translationError
          ? `Translation error: ${translationError}`
          : translatedText || (isTranslating ? 'Translating…' : 'Translation will appear here.')}
      </div>

      <div className="rounded-xl border border-gray-800/60 bg-black/40 p-4 space-y-3">
        <button
          type="button"
          onClick={speakTranslation}
          disabled={!translatedText || isSpeaking}
          className="rounded-full border border-white/60 px-5 py-2 text-sm font-semibold text-white hover:border-white disabled:border-gray-700 disabled:text-gray-500"
        >
          {isSpeaking ? 'Generating audio…' : 'Speak translation'}
        </button>

        {speechError && (
          <p className="text-sm text-red-300">
            {speechError}
          </p>
        )}

        {archiveError && (
          <p className="text-sm text-red-300">
            {archiveError}
          </p>
        )}

        {speechUrl && (
          <audio
            controls
            src={speechUrl}
            className="w-full max-w-md"
          />
        )}
      </div>
    </section>
  )
}

