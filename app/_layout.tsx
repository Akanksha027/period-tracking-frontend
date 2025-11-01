import { Stack } from 'expo-router'
import { AuthProvider } from '../contexts/AuthContext'
import { OnboardingProvider } from '../contexts/OnboardingContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </OnboardingProvider>
    </AuthProvider>
  )
}

