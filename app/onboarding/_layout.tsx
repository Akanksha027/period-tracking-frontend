import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="step1-date" />
      <Stack.Screen name="step2-period-length" />
      <Stack.Screen name="step3-cycle-length" />
      <Stack.Screen name="step4-symptoms" />
    </Stack>
  )
}



