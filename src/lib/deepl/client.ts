const BASE_URL = 'https://api.deepl.com/v2'

const FREE_BASE_URL = 'https://api-free.deepl.com/v2'

export type DeepLTranslateResponse = {
  translations: Array<{
    detected_source_language: string
    text: string
  }>
}

export type DeepLTranslatePayload = {
  text: string
  target_lang: string
  source_lang?: string
}

const getBaseUrl = () => {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured')
  }

  return apiKey.startsWith('free:') ? FREE_BASE_URL : BASE_URL
}

export async function translateWithDeepL(payload: DeepLTranslatePayload) {
  const apiKey = process.env.DEEPL_API_KEY

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured')
  }

  const response = await fetch(`${getBaseUrl()}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `DeepL-Auth-Key ${apiKey.replace(/^free:/, '')}`,
    },
    body: JSON.stringify({
      text: [payload.text],
      target_lang: payload.target_lang.toUpperCase(),
      source_lang: payload.source_lang?.toUpperCase(),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepL request failed: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as DeepLTranslateResponse

  if (!data.translations?.length) {
    throw new Error('DeepL response missing translations')
  }

  return data.translations[0]
}

