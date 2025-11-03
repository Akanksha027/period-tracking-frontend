import axios from 'axios'
import { supabase } from './supabase'
import Constants from 'expo-constants'

const extra =
  ((Constants as any)?.expoConfig?.extra as any) ||
  ((Constants as any)?.manifest?.extra as any) ||
  ((Constants as any)?.manifest2?.extra as any) ||
  {}

function resolveApiBase(): string {
  // Priority 1: From app.config.js extra.API_URL
  if (extra?.API_URL) {
    console.log('[API] Using API_URL from app.config.js:', extra.API_URL)
    return extra.API_URL as string
  }

  // Priority 2: From environment variable
  const fromEnv = process.env.EXPO_PUBLIC_API_URL as string
  if (fromEnv && !/localhost|127\.0\.0\.1/.test(fromEnv)) {
    console.log('[API] Using API_URL from env:', fromEnv)
    return fromEnv
  }

  // Priority 3: Try to infer LAN IP from debuggerHost/hostUri
  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost
  if (typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0]
    if (ip && ip !== 'localhost') {
      const inferred = `http://${ip}:3000`
      console.log('[API] Using inferred API_URL:', inferred)
      return inferred
    }
  }

  // Fallback (won't work on device)
  console.warn('[API] Using fallback localhost (may not work on device)')
  return 'http://localhost:3000'
}

const API_URL = resolveApiBase()
console.log('[API] Final API_URL resolved to:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased timeout for slow networks and Vercel cold starts
})

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.warn('[API] Error getting session:', error)
    } else if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
      console.log('[API] Auth token added to request:', config.url)
    } else {
      console.warn('[API] No session found for request:', config.url)
    }
  } catch (error) {
    console.warn('[API] Failed to get session for auth:', error)
  }
  return config
})

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout after 30s:', error.config?.url)
      console.error('[API] Backend might be slow or experiencing issues')
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('[API] Network Error - Cannot reach backend at:', API_URL)
      console.error('[API] Attempted URL:', error.config?.baseURL + error.config?.url)
      console.error('[API] Error details:', {
        message: error.message,
        code: error.code,
        requestURL: error.config?.url,
        baseURL: error.config?.baseURL,
      })
      // Provide more helpful error message
      if (API_URL.includes('vercel.app')) {
        console.warn('[API] Vercel deployment might be cold starting or experiencing issues')
        console.warn('[API] Try again in a few seconds')
      }
    } else if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized:', error.config?.url)
      console.error('[API] Check if user session is valid')
    } else if (error.response) {
      console.error('[API] Request failed:', error.message, error.config?.url)
      console.error('[API] Status:', error.response.status)
      console.error('[API] Response:', error.response.data)
    } else {
      console.error('[API] Unknown error:', error.message, error.config?.url)
      console.error('[API] Error object:', error)
    }
    return Promise.reject(error)
  }
)

export interface Period {
  id: string
  userId: string
  startDate: string
  endDate: string | null
  flowLevel: 'light' | 'medium' | 'heavy' | null
  createdAt: string
  updatedAt: string
}

export interface Symptom {
  id: string
  userId: string
  date: string
  type: string
  severity: number
  createdAt: string
  updatedAt: string
}

export interface Mood {
  id: string
  userId: string
  date: string
  type: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  userId: string
  date: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  id: string
  userId: string
  averageCycleLength: number
  averagePeriodLength: number
  reminderEnabled: boolean
  reminderDaysBefore: number
  createdAt: string
  updatedAt: string
}

export interface Prediction {
  nextPeriodDate: string
  cycleLength: number
  periodLength: number
  confidence: 'low' | 'medium' | 'high'
}

// User API
export const getUser = async () => {
  const response = await api.get('/api/user')
  return response.data
}

// Initialize user (creates user in database if doesn't exist)
export const initializeUser = async () => {
  console.log('[API] Initializing user in database...')
  const response = await api.get('/api/user')
  console.log('[API] User initialized:', response.data.email)
  return response.data
}

export const updateUser = async (name: string) => {
  const response = await api.patch('/api/user', { name })
  return response.data
}

// Period API
export const getPeriods = async (): Promise<Period[]> => {
  const response = await api.get('/api/periods')
  return response.data
}

export const createPeriod = async (data: {
  startDate: string
  endDate?: string | null
  flowLevel?: 'light' | 'medium' | 'heavy' | null
}): Promise<Period> => {
  const response = await api.post('/api/periods', data)
  return response.data
}

export const updatePeriod = async (id: string, data: {
  startDate?: string
  endDate?: string | null
  flowLevel?: 'light' | 'medium' | 'heavy' | null
}): Promise<Period> => {
  const response = await api.patch(`/api/periods/${id}`, data)
  return response.data
}

export const deletePeriod = async (id: string) => {
  const response = await api.delete(`/api/periods/${id}`)
  return response.data
}

// Symptom API
export const getSymptoms = async (startDate?: string, endDate?: string): Promise<Symptom[]> => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const response = await api.get(`/api/symptoms?${params}`)
  return response.data
}

export const createSymptom = async (data: {
  date: string
  type: string
  severity: number
}): Promise<Symptom> => {
  const response = await api.post('/api/symptoms', data)
  return response.data
}

export const deleteSymptom = async (id: string) => {
  const response = await api.delete(`/api/symptoms/${id}`)
  return response.data
}

// Mood API
export const getMoods = async (startDate?: string, endDate?: string): Promise<Mood[]> => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const response = await api.get(`/api/moods?${params}`)
  return response.data
}

export const createMood = async (data: {
  date: string
  type: string
}): Promise<Mood> => {
  const response = await api.post('/api/moods', data)
  return response.data
}

export const deleteMood = async (id: string) => {
  const response = await api.delete(`/api/moods/${id}`)
  return response.data
}

// Note API
export const getNotes = async (startDate?: string, endDate?: string): Promise<Note[]> => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const response = await api.get(`/api/notes?${params}`)
  return response.data
}

export const createNote = async (data: {
  date: string
  content: string
}): Promise<Note> => {
  const response = await api.post('/api/notes', data)
  return response.data
}

// Settings API
export const getSettings = async (): Promise<UserSettings | null> => {
  try {
    const response = await api.get('/api/settings')
    return response.data
  } catch (error: any) {
    // If settings don't exist, return null (backend will create defaults)
    if (error.response?.status === 500) {
      console.warn('[API] Settings endpoint returned 500, may need to be created')
      return null
    }
    throw error
  }
}

export const updateSettings = async (data: Partial<UserSettings>): Promise<UserSettings> => {
  const response = await api.patch('/api/settings', data)
  return response.data
}

// Predictions API
export const getPredictions = async (): Promise<Prediction> => {
  const response = await api.get('/api/predictions')
  return response.data
}

// Chat AI API
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  symptoms?: Array<{
    symptom: string
    severity?: string
    frequency?: string
  }>
}

export interface ChatResponse {
  message: string
}

export const chatWithAI = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post('/api/chat', data)
  return response.data
}

export default api

