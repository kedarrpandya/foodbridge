import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

export type OrganizationOut = {
  id: number
  name: string
  type: string
  address?: string | null
}

export type ItemOut = {
  id: number
  org_id: number
  title: string
  description?: string | null
  category?: string | null
  storage_type?: string | null
  quantity?: number | null
  ready_at?: string | null
  expires_at?: string | null
  pickup_window?: string | null
  status: string
  photo_url?: string | null
  organization?: {
    id: number
    name: string
    type: string
    address?: string | null
    lat?: number | null
    lng?: number | null
    phone?: string | null
    email?: string | null
  } | null
}

export async function getAnalyticsSummary() {
  const { data } = await api.get('/analytics/summary')
  return data as {
    total_items: number
    total_claimed: number
    total_unclaimed: number
    claim_rate: number
    donors: number
    recipients: number
    items_expiring_next_24h: number
  }
}

export async function logEvent(payload: {
  event_type: string
  item_id?: number
  org_id?: number
  metadata?: Record<string, any>
}) {
  const { data } = await api.post('/analytics/events', payload)
  return data
}

export async function getAnalyticsSeries(days = 14) {
  const { data } = await api.get('/analytics/series', { params: { days } })
  return data as {
    labels: string[]
    created: number[]
    claimed: number[]
  }
}

export async function getAnalyticsCategories(days = 30) {
  const { data } = await api.get('/analytics/categories', { params: { days } })
  return data as { created: Record<string, number>; claimed: Record<string, number> }
}

export async function getAnalyticsForecast(days = 14, horizon = 7) {
  const { data } = await api.get('/analytics/forecast', { params: { days, horizon } })
  return data as { labels: string[]; created: number[]; claimed: number[] }
}

export async function getRisk(limit = 10) {
  const { data } = await api.get('/analytics/risk', { params: { limit } })
  return data as { items: Array<{ id: number; title: string; category: string; org_id: number; expires_at?: string | null; hours_left?: number | null; quantity?: number | null; risk_score: number }> }
}

export async function getCohorts(weeks = 12) {
  const { data } = await api.get('/analytics/cohorts', { params: { weeks } })
  return data as { labels: string[]; offsets: number[]; matrix: number[][] }
}

export async function getAnalyticsExplain() {
  const { data } = await api.get('/analytics/explain')
  return data as { insights: string[]; ai_powered: boolean; openai_available: boolean }
}

export async function getDetailedAnalyticsExplain() {
  const { data } = await api.get('/analytics/explain/detailed')
  return data as { insights: string[]; ai_powered: boolean; model?: string; note?: string; error?: string }
}

export async function getAnalyticsLocations(limit = 10) {
  const { data } = await api.get('/analytics/locations', { params: { limit } })
  return data as {
    top_donation_locations: Array<{ address: string; lat: number; lng: number; count: number }>
    top_claim_locations: Array<{ address: string; lat: number; lng: number; count: number }>
  }
}

export async function getAnalyticsContributors(limit = 10) {
  const { data } = await api.get('/analytics/contributors', { params: { limit } })
  return data as {
    top_donors: Array<{ name: string; email: string; donations: number }>
    top_recipients: Array<{ name: string; email: string; claims: number }>
  }
}

export async function getAnalyticsPredictions() {
  const { data } = await api.get('/analytics/predictions')
  return data as {
    hourly_patterns: Array<{ hour: number; count: number }>
    daily_patterns: Array<{ day: string; day_number: number; count: number }>
    predictions: {
      best_donation_hours: Array<{ hour: number; count: number }>
      best_donation_days: Array<{ day: string; count: number }>
      next_peak_time: string
    }
  }
}


