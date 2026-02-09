# GamerHub Mobile

React Native mobile app for GamerHub - India's Gaming Identity Platform.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your physical device (iOS/Android)
- Supabase project (shared with web app)

## Setup

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Create a `.env` file with your Supabase credentials:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase URL and anon key:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with Expo Go app on your phone.

## Running on Physical Device

### iOS
- Download "Expo Go" from the App Store
- Scan the QR code from the terminal

### Android
- Download "Expo Go" from Google Play Store
- Scan the QR code from the terminal

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry point
├── src/
│   ├── components/         # Reusable UI components
│   │   └── ui/            # Base UI components (Button, Input, Card, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configuration
│   │   ├── supabase.ts    # Supabase client setup
│   │   └── theme.ts       # Theme colors and constants
│   ├── navigation/        # React Navigation setup
│   ├── screens/           # App screens
│   │   ├── auth/          # Authentication screens
│   │   └── main/          # Main app screens
│   ├── stores/            # Zustand state stores
│   └── types/             # TypeScript type definitions
└── assets/                # Images and static assets
```

## Features

- **Authentication**: Login, Register, Onboarding
- **Dashboard**: Overview of matches, friends, stats
- **Community**: Discover and join clans
- **Find Gamers**: Search and connect with other players
- **Messages**: Direct and group messaging
- **Profile**: User profile with games and stats
- **Notifications**: In-app notifications

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation (navigation)
- Zustand (state management)
- TanStack Query (server state)
- Supabase (backend)
- Expo Image (optimized images)
- Lucide Icons

## Building for Production

### Preview Build
```bash
npx expo build:android
npx expo build:ios
```

### EAS Build (Recommended)
```bash
npx eas build --platform android
npx eas build --platform ios
```

## Contributing

1. Make sure to test on both iOS and Android
2. Follow the existing code style
3. Update types when adding new features
