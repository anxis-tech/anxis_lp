export interface UTMData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  fbclid?: string
  landing_page?: string
  referrer?: string
}

const STORAGE_KEY = 'anxis_utm_data'

export function captureUTMs(): UTMData {
  if (typeof window === 'undefined') return {}

  try {
    const urlParams = new URLSearchParams(window.location.search)
    const existing = getStoredUTMs()

    const captured: UTMData = {
      utm_source: urlParams.get('utm_source') || existing.utm_source || undefined,
      utm_medium: urlParams.get('utm_medium') || existing.utm_medium || undefined,
      utm_campaign: urlParams.get('utm_campaign') || existing.utm_campaign || undefined,
      utm_content: urlParams.get('utm_content') || existing.utm_content || undefined,
      utm_term: urlParams.get('utm_term') || existing.utm_term || undefined,
      gclid: urlParams.get('gclid') || existing.gclid || undefined,
      fbclid: urlParams.get('fbclid') || existing.fbclid || undefined,
      landing_page: existing.landing_page || window.location.pathname,
      referrer: existing.referrer || document.referrer || undefined,
    }

    // Persist if any UTM parameter exists
    if (Object.values(captured).some(Boolean)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured))
    }

    return captured
  } catch {
    return {}
  }
}

export function getStoredUTMs(): UTMData {
  if (typeof window === 'undefined') return {}
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}
