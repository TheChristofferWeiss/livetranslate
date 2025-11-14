const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'
const TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

const getVoiceId = (voiceId?: string) =>
  voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID

export async function streamSpeechFromElevenLabs(text: string, voiceId?: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }

  const resolvedVoice = getVoiceId(voiceId)

  const response = await fetch(
    `${TTS_URL}/${resolvedVoice}/stream?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${errorText || 'Unknown error'}`
    )
  }

  return Buffer.from(await response.arrayBuffer())
}

