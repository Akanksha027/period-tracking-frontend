import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { initializeUser } from '../../lib/api'
import { Colors } from '../../constants/Colors'

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing OAuth callback...')
        console.log('[AuthCallback] Params:', params)

        // Extract code from URL parameters
        const code = params.code as string
        const error = params.error as string
        const errorDescription = params.error_description as string

        if (error) {
          console.error('[AuthCallback] OAuth error:', error, errorDescription)
          router.replace('/(auth)/login')
          return
        }

        if (!code) {
          console.error('[AuthCallback] No code in callback URL')
          router.replace('/(auth)/login')
          return
        }

        console.log('[AuthCallback] Exchanging code for session...')
        
        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('[AuthCallback] Exchange error:', exchangeError)
          router.replace('/(auth)/login')
          return
        }

        if (data?.session) {
          console.log('[AuthCallback] Session created successfully!')
          
          // Initialize user in database
          try {
            console.log('[AuthCallback] Initializing user in database...')
            await initializeUser()
            console.log('[AuthCallback] User initialized successfully')
          } catch (initError) {
            console.error('[AuthCallback] Failed to initialize user:', initError)
          }
          
          // Navigate to home
          router.replace('/(tabs)/home')
        } else {
          console.error('[AuthCallback] No session in exchange result')
          router.replace('/(auth)/login')
        }
      } catch (error: any) {
        console.error('[AuthCallback] Error processing callback:', error)
        router.replace('/(auth)/login')
      }
    }

    handleCallback()
  }, [params, router])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Signing in...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  text: {
    color: Colors.text,
    fontSize: 16,
  },
})



