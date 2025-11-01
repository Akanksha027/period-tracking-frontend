import React, { createContext, useContext, useState, useEffect } from 'react'
import { getPeriods, getSettings } from '../lib/api'

interface OnboardingContextType {
  needsOnboarding: boolean | null
  checkOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType>({
  needsOnboarding: null,
  checkOnboarding: async () => {},
})

export const useOnboarding = () => useContext(OnboardingContext)

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  const checkOnboarding = async () => {
    try {
      // Check if user has periods and custom settings
      const [periods, settings] = await Promise.all([
        getPeriods().catch(() => []),
        getSettings().catch(() => null),
      ])

      // If no periods exist, user needs onboarding
      const hasPeriods = periods && periods.length > 0
      
      // If settings exist but are default (28 days cycle, 5 days period), might still need onboarding
      // For now, we'll only check if periods exist
      setNeedsOnboarding(!hasPeriods)
    } catch (error) {
      console.error('[OnboardingContext] Error checking onboarding:', error)
      // On error, assume onboarding is needed
      setNeedsOnboarding(true)
    }
  }

  return (
    <OnboardingContext.Provider value={{ needsOnboarding, checkOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  )
}



