import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const extra =
  // dev server
  ((Constants as any)?.expoConfig?.extra as any) ||
  // classic manifest
  ((Constants as any)?.manifest?.extra as any) ||
  // new manifest
  ((Constants as any)?.manifest2?.extra as any) ||
  {}

const supabaseUrl = (
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string) ||
  (extra?.SUPABASE_URL as string) ||
  ''
).trim()

const supabaseAnonKey = (
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) ||
  (extra?.SUPABASE_ANON_KEY as string) ||
  ''
).trim()

if (!supabaseUrl || !supabaseAnonKey) {
  // Help diagnose env issues without leaking the full key
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env missing',
    {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
      extraKeys: Object.keys(extra || {}),
      urlPreview: supabaseUrl?.slice(0, 28),
    }
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

