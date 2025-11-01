# Period Tracker Mobile App

A React Native mobile app built with Expo for tracking menstrual cycles, symptoms, moods, and notes.

## Features

- 📅 Period tracking with flow levels
- 🔮 Cycle predictions based on history
- 📊 Symptom and mood logging
- 📝 Personal notes
- 📈 Insights and analytics
- 🔔 Period reminders
- 🔐 Secure authentication with Supabase

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials and backend API URL

3. Start the app:
```bash
npm start
```

4. Run on your device:
   - Install Expo Go on your phone
   - Scan the QR code shown in the terminal
   - Or press `i` for iOS simulator or `a` for Android emulator

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **Expo Router** - File-based routing
- **Supabase** - Authentication
- **Axios** - API calls
- **React Native Calendars** - Calendar component

## Project Structure

```
frontend/
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   └── supabase.ts       # Supabase client
└── constants/            # App constants
    └── Colors.ts         # Color palette
```

## Screens

- **Home** - Overview with next period prediction and stats
- **Calendar** - Visual calendar with period days marked
- **Log** - Log periods, symptoms, moods, and notes
- **Insights** - Analytics and health tips
- **Profile** - Settings and account management

## API Integration

The app connects to the Next.js backend API. Make sure the backend is running and the API URL is correctly set in your `.env` file.

## Development

This app is designed to run on Expo Go for easy development and testing. All features work with Expo Go - no need for custom native code.

To test:
1. Start the backend server
2. Start the Expo development server
3. Open in Expo Go on your phone
4. Create an account and start tracking!

