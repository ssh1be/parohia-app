# Parohia

A mobile app for Orthodox parishes, built with React Native and Expo.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo Go](https://expo.dev/go) on your phone, or an Android/iOS emulator

## Getting Started

1. **Clone the repo**

```bash
git clone https://github.com/your-org/Parohia.git
cd Parohia
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the project root with the following keys:

```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_GOOGLE_CALENDAR_API_KEY=<your-google-calendar-api-key>
```

> **Note:** Contact the project administrator (support@parohia.app) to request these API keys before you can run the app.

4. **Start the app**

```bash
npx expo start
```

Scan the QR code with the Expo Go app (Android/iOS) or press `a` / `i` to open in an emulator.
