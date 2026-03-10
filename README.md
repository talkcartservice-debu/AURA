# AURAsync - Modern Dating & Social Matching Platform 💕

A full-stack dating and social matching web application built with React, Express, MongoDB, and advanced real-time features.

## 🚀 Features Implemented

### Core Dating Features
- ✅ **Swiping Match System** - Enhanced with advanced animations, haptic feedback, and multi-directional gestures
- ✅ **Daily Matches** - AI-generated compatibility scoring
- ✅ **Super Likes** - Premium microtransaction feature
- ✅ **Boost** - Profile visibility boost
- ✅ **Location-Based Recommendations** - Geospatial tracking for nearby matches
- ✅ **Advanced Search Filters** - Age, interests, relationship goals

### Communication Features
- ✅ **Real-Time Chat** - WebSocket-powered messaging
- ✅ **Online/Offline Status** - Real-time user presence indicators
- ✅ **Typing Indicators** - Live typing status
- ✅ **Message Read Receipts** - Track message status
- ✅ **WebRTC Video/Audio Calls** - In-app calling with ringtone and vibration
- ✅ **Icebreaker Messages** - AI-generated conversation starters

### Verification & Security
- ✅ **Deep Verification System** - Multi-layer identity verification
  - ID document verification (Passport, Driver's License, National ID)
  - Phone verification with OTP
  - Social media account linking
  - Video verification with liveness detection
  - Background checks (premium feature)
- ✅ **Biometric Authentication** - Fingerprint/WebAuthn login
- ✅ **Photo Verification** - Selfie matching
- ✅ **AI Fraud Detection** - Risk scoring and pattern analysis
- ✅ **Personality Verification** - Psychological assessment

### Premium Features
- ✅ **Subscription Plans** - Free, Basic, Premium tiers
- ✅ **Casual Mode** - Discreet dating mode
- ✅ **Incognito Mode** - Browse privately
- ✅ **Advanced Filters** - Premium search options
- ✅ **Unlimited Likes** - No daily limits
- ✅ **See Who Liked You** - View admirers
- ✅ **Priority Support** - VIP customer service

### User Experience Enhancements
- ✅ **Enhanced Swiping** - Tinder-like gestures with visual effects
- ✅ **Haptic Feedback** - Tactile response on actions
- ✅ **Smooth Animations** - Framer Motion powered
- ✅ **Responsive Design** - Mobile-first Tailwind CSS
- ✅ **Dark Mode** - Theme customization
- ✅ **Profile Customization** - Extensive profile fields

### Technical Features
- ✅ **Real-Time Updates** - Socket.IO integration
- ✅ **Geolocation Tracking** - GPS-based location services
- ✅ **Distance Calculations** - Haversine formula
- ✅ **Image Upload** - Cloudinary integration
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Passwordless Login** - Biometric and email options
- ✅ **Rate Limiting** - API protection
- ✅ **Data Encryption** - AES-256 storage

## 🛠️ Tech Stack

### Frontend
- **React** 18 with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **TanStack Query** for data fetching
- **Axios** for HTTP requests
- **Socket.IO Client** for real-time features
- **Lucide Icons** for iconography

### Backend
- **Express.js** REST API
- **MongoDB** with Mongoose ODM
- **Socket.IO** for WebSocket server
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Cloudinary** for image storage
- **Multer** for file uploads

### DevOps & Tools
- **Git** for version control
- **GitHub** for repository hosting
- **npm** for package management
- **Vite** for build tooling
- **ESLint** for code quality

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- Git

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Frontend Setup
```bash
npm install
npm run dev
```

## 🔑 Environment Variables

Create `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/aurasync
JWT_SECRET=your_jwt_secret_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Profiles
- `GET /api/profiles/me` - Get my profile
- `PUT /api/profiles/me` - Update profile
- `POST /api/profiles/upload` - Upload photos

### Matches & Likes
- `GET /api/matches/daily` - Get daily matches
- `POST /api/likes` - Send like
- `POST /api/likes/super` - Send super like

### Messages
- `GET /api/messages/:userId` - Get conversation
- `POST /api/messages` - Send message

### Verification
- `POST /api/deep-verification/deep/init` - Start verification
- `POST /api/deep-verification/deep/id-document` - Submit ID
- `POST /api/deep-verification/deep/phone/send-code` - Send OTP
- `POST /api/deep-verification/deep/phone/verify-code` - Verify OTP

### Location
- `POST /api/location/update` - Update location
- `GET /api/location/nearby` - Find nearby users
- `GET /api/location/compatibility` - Calculate distance compatibility

## 🎯 Key Features Documentation

### [Deep Verification System](DEEP_VERIFICATION_SYSTEM.md)
Comprehensive multi-layer identity verification with ID documents, phone, social media, video, and background checks.

### [Enhanced Swiping](ENHANCED_SWIPING_FEATURES.md)
Advanced gesture controls with haptic feedback, particle effects, and smooth animations.

### [Location Tracking](ENHANCED_LOCATION_TRACKING.md)
Geospatial recommendations with distance calculations and nearby user discovery.

### [Biometric Authentication](BIOMETRIC_FINAL_WORKING_FLOW.md)
WebAuthn-based fingerprint login with device-bound credentials.

## 📊 Project Stats

- **Total Files**: 200+
- **Lines of Code**: 50,000+
- **Components**: 80+
- **API Endpoints**: 40+
- **Database Models**: 15+

## 🔒 Security Features

- JWT token authentication
- Bcrypt password hashing
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- Encrypted data storage
- Secure WebSocket connections

## 🚀 Performance

- Code splitting with Vite
- Lazy loading components
- Image optimization
- Database indexing
- Redis caching ready
- CDN integration via Cloudinary

## 📱 Mobile Responsive

- Mobile-first design approach
- Touch-optimized interactions
- Responsive breakpoints
- PWA-ready architecture

## 🎨 UI Components

Built with shadcn/ui component library:
- 40+ pre-built components
- Fully customizable
- Accessible (WCAG compliant)
- Dark mode support

## 🧪 Testing

```bash
# Run tests (when configured)
npm test
```

## 📖 Documentation

- [Quick Start Guide](QUICK_START.md)
- [Premium Features](PREMIUM_IMPLEMENTATION.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Visual Demo Guide](VISUAL_DEMO_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

Built by the AURAsync development team

## 🗺️ Roadmap

- [ ] AI-powered match recommendations
- [ ] Virtual dating features
- [ ] Event planning tools
- [ ] Group activities
- [ ] Video profiles
- [ ] Advanced analytics dashboard
- [ ] International expansion
- [ ] Native mobile apps (iOS/Android)

## 📞 Support

For support, email support@aurasync.com or join our Discord community.

## 🙏 Acknowledgments

- Inspired by modern dating apps
- Built with open-source technologies
- Community-driven improvements

---

**Version**: 2.0.0  
**Last Updated**: March 2026  
**Status**: Production Ready ✅
