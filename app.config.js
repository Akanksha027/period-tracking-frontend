// Dynamic Expo config to ensure env is injected at runtime
/** @type {import('expo/config').ExpoConfig} */
module.exports = () => {
  return {
    name: 'Period Tracker',
    slug: 'period-tracker',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: { backgroundColor: '#ff6b9d' },
    ios: { supportsTablet: true, bundleIdentifier: 'com.periodtracker.app' },
    android: { package: 'com.periodtracker.app' },
    scheme: 'period-tracker',
    plugins: ['expo-router'],
    extra: {
        SUPABASE_URL: 'https://sdujszipolfokscvgzjg.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdWpzemlwb2xmb2tzY3ZnempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzUyMTAsImV4cCI6MjA3NzQxMTIxMH0.hGPRkoOfYe-wOw_DUPnl0g5I_WSv1LTcn9VZ3-_5PVE',
        API_URL: 'https://periods-testing-backend.vercel.app',
      },
  }
}


