export type AnalyticsEventName =
  | 'click_primary_cta'
  | 'click_whatsapp'
  | 'click_project'
  | 'form_submit_start'
  | 'form_submit_success'
  | 'form_submit_error'
  | 'click_phone'
  | 'click_email'
  | 'view_projects_section'
  | 'view_final_cta'

export function trackEvent(eventName: AnalyticsEventName, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined') return

  try {
    // 1. Google Tag Manager / GA4 DataLayer
    if ((window as any).dataLayer) {
      ;(window as any).dataLayer.push({
        event: eventName,
        ...eventParams,
        timestamp: new Date().toISOString(),
      })
    }

    // 2. Meta Pixel
    if ((window as any).fbq) {
      ;(window as any).fbq('trackCustom', eventName, eventParams)
    }

    // Console logging in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ANXIS Analytics Event]: ${eventName}`, eventParams)
    }
  } catch (err) {
    console.error('Error tracking event:', err)
  }
}
