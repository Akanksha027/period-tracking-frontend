import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { useOnboarding } from '../contexts/OnboardingContext'
import { Colors } from '../constants/Colors'

export default function Index() {
  const { user, loading: authLoading } = useAuth()
  const { needsOnboarding, checkOnboarding } = useOnboarding()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      // Check if onboarding is needed
      setCheckingOnboarding(true)
      checkOnboarding().finally(() => {
        setCheckingOnboarding(false)
      })
    }
  }, [authLoading, user, checkOnboarding])

  useEffect(() => {
    if (!authLoading && !checkingOnboarding) {
      if (user) {
        if (needsOnboarding === true) {
          router.replace('/onboarding/step1-date')
        } else if (needsOnboarding === false) {
          router.replace('/(tabs)/home')
        }
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [user, authLoading, needsOnboarding, checkingOnboarding, router])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
})

