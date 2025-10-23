# Parohia - A Modern Companion for an Ancient Faith 🏛️

Parohia is a comprehensive mobile application designed to help Orthodox Christians connect with their parish community, stay informed about the Orthodox calendar, and manage their spiritual life. Built with React Native and Expo, Parohia bridges the gap between ancient Orthodox traditions and modern technology.

## 🌟 Features

### 📅 Orthodox Calendar Integration
- **Daily Orthodox Calendar**: View daily saints, feasts, and fasting guidelines
- **Scripture Readings**: Access daily Orthodox scripture readings with full text
- **Fasting Calendar**: Visual indicators for fasting days and dietary guidelines
- **Parish Events**: Integration with Google Calendar for parish-specific events

### 🏛️ Parish Management
- **Parish Directory**: Browse and connect to verified Orthodox parishes
- **Parish Administration**: Tools for parish administrators to manage their community
- **Contact Information**: Direct access to parish contact details, priest information
- **Donation Integration**: Secure PayPal donation functionality for parish support

### 📋 Bulletin Board System
- **Announcements**: Parish-wide announcements and news
- **Event Management**: Create and RSVP to parish events
- **Volunteer Coordination**: Organize and sign up for volunteer opportunities
- **Push Notifications**: Stay informed with customizable notifications

### 🙏 Confession Scheduling
- **Time Slot Management**: Priests can set available confession times
- **Online Booking**: Parishioners can reserve confession appointments
- **Automated Reminders**: Notification system for upcoming appointments
- **Privacy Protection**: Secure and confidential reservation system

### 👤 User Management
- **Dual User Types**: Support for both parish administrators and regular parishioners
- **Onboarding Flow**: Guided setup for new users
- **Profile Management**: Manage personal information and preferences
- **Authentication**: Secure login with Supabase authentication

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Parohia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your Supabase configuration:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device testing

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router with file-based routing
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **State Management**: React Context API
- **Notifications**: Expo Notifications
- **Maps**: React Native Google Places Autocomplete

### Project Structure
```
Parohia/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── index.tsx          # App entry point
├── components/            # Reusable UI components
├── contexts/              # React Context providers
├── services/              # API and business logic
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── config/                # Configuration files
└── assets/                # Images and fonts
```

### Key Services
- **AuthContext**: User authentication and session management
- **NotificationContext**: Push notification handling
- **OnboardingContext**: User onboarding flow management
- **BulletinService**: Parish bulletin board functionality
- **ConfessionService**: Confession scheduling system
- **CalendarService**: Orthodox calendar and parish events
- **ParishService**: Parish management and directory

## 📱 App Screens

### Authentication Flow
- **Welcome Screen**: App introduction and login options
- **Login/OTP**: Phone-based authentication with OTP verification
- **Onboarding**: User type selection, parish selection, and profile setup

### Main Application
- **Home Tab**: Daily Orthodox calendar, today's schedule, scripture readings
- **Events Tab**: Bulletin board and confession scheduling
- **Calendar Tab**: Full Orthodox calendar with parish events
- **Parish Tab**: Parish information, priest contact, donations

## 🔧 Configuration

### Supabase Setup
The app requires a Supabase backend with the following tables:
- `user_profiles` - User information and preferences
- `parishes` - Parish directory and information
- `user_parish_connections` - User-parish relationships
- `bulletin_events` - Parish bulletin board posts
- `confession_schedules` - Available confession time slots
- `confession_reservations` - User confession bookings

### Push Notifications
Configure Expo push notifications for:
- New bulletin board posts
- Confession reminders
- Parish event notifications
- Daily Orthodox calendar updates

## 🚢 Deployment

### Building for Production

1. **Configure app.json**
   Update bundle identifiers, app icons, and splash screens

2. **Build with EAS**
   ```bash
   npx eas build --platform all
   ```

3. **Submit to App Stores**
   ```bash
   npx eas submit --platform all
   ```

### Environment Configuration
- **Development**: Local Supabase instance or development environment
- **Staging**: Staging Supabase project for testing
- **Production**: Production Supabase project with proper RLS policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Orthodox Calendar API for liturgical data
- Supabase for backend infrastructure
- Expo team for the excellent development platform
- Orthodox Christian community for feedback and support

## 📞 Support

For support and feedback, please contact: support@parohia.app

Visit our website: [https://parohia.app](https://parohia.app)

---

*"Embrace the Orthodox faith with modern technology"* - Parohia connects ancient traditions with contemporary convenience.
