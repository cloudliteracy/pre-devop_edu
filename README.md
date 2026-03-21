# CloudLiteracy - DevOps Educational Platform

A full-stack educational platform for pre-DevOps learning with payment integration for MTN Mobile Money, Orange Money, Visa/Mastercard, and PayPal.

## Features

### Core Learning Features
- 7 Pre-DevOps learning modules with structured content
- PDF and video content per module
- Interactive quizzes with scoring and passing requirements
- Progress tracking system (videos 40%, PDFs 30%, quizzes 30%)
- Color-coded progress indicators (red <30%, yellow 30-70%, green >70%)

### Payment & Access
- Multi-payment gateway support (MTN MoMo, Orange Money, Stripe, PayPal)
- Secure payment verification and module access control
- Donation system with custom amounts and all payment gateways
- USD currency for all transactions

### User Experience
- User authentication with JWT tokens
- Role-based access control (user/admin)
- Black (#000000, #1a1a1a) and gold (#FFD700) themed UI
- Password visibility toggles and drag-drop captcha
- Forgot password functionality
- 5-star rating system with hover effects
- Responsive navigation with animated hover effects

### Admin Dashboard
- Comprehensive overview with stats cards (users, enrollments, revenue, completion)
- User management with search and pagination
- Detailed user progress tracking with expandable module breakdowns
- Module analytics and performance metrics
- Recent activity feed (registrations, payments, quiz completions)

### Additional Pages
- About Us page with mission and vision
- Contact Us page with form submission
- Privacy Policy with comprehensive data protection information

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB
- JWT Authentication
- Stripe, PayPal, MTN MoMo, Orange Money APIs

**Frontend:**
- React
- React Router
- Axios

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (free tier)
- Payment gateway accounts (see detailed setup below)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Setup MongoDB Atlas (Free Tier):
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up and create a FREE M0 cluster
   - Create database user (username: `cloudliteracy`, save password)
   - Whitelist IP: Add `0.0.0.0/0` (allow from anywhere)
   - Get connection string from "Connect" → "Connect your application"
   - Replace `<password>` in connection string with your actual password

4. Setup Payment Gateways:

   **Stripe (Visa/Mastercard) - Required for testing:**
   - Sign up at https://dashboard.stripe.com/register
   - Go to Developers → API Keys
   - Copy both Publishable key (`pk_test_...`) and Secret key (`sk_test_...`)

   **PayPal - Optional:**
   - Sign up at https://developer.paypal.com/
   - Create app in "My Apps & Credentials"
   - Copy Client ID and Secret

   **MTN Mobile Money (Cameroon) - Optional:**
   - Register at https://momodeveloper.mtn.com/
   - Subscribe to "Collection" product
   - Get sandbox credentials (takes time for approval)

   **Orange Money (Cameroon) - Optional:**
   - Contact Orange Cameroon business team
   - Request API merchant account
   - Requires business registration (takes weeks)

5. Create `.env` file (copy from `.env.example`):
```bash
copy .env.example .env
```

6. Update `.env` with your credentials:
```env
MONGODB_URI=mongodb+srv://cloudliteracy:<password>@cluster0.xxxxx.mongodb.net/cloudliteracy
JWT_SECRET=your_random_secret_key_minimum_32_characters
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

7. Seed the database with initial modules:
```bash
node seedModules.js
```

8. Start the server:
```bash
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend runs on: http://localhost:3000

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Modules
- GET `/api/modules` - Get all modules
- GET `/api/modules/:id` - Get module by ID (requires auth + payment)
- POST `/api/modules` - Create module (admin)

### Payments
- POST `/api/payments/initiate` - Initiate payment (supports donations with isDonation flag)
- GET `/api/payments/verify/:id` - Verify payment status
- POST `/api/payments/verify-stripe` - Verify Stripe payment
- POST `/api/payments/verify-paypal` - Verify PayPal payment

### Quiz
- GET `/api/quiz/:moduleId` - Get quiz (requires auth + payment)
- POST `/api/quiz/:moduleId/submit` - Submit quiz answers

### Progress Tracking
- POST `/api/progress/track` - Track video/PDF progress (requires auth)
- GET `/api/progress/:moduleId` - Get user progress for module (requires auth)
- PUT `/api/progress/:moduleId/quiz` - Update quiz completion (requires auth)

### Ratings
- POST `/api/ratings` - Submit or update rating (requires auth)
- GET `/api/ratings/stats` - Get average rating and total count

### Admin (requires admin role)
- GET `/api/admin/stats` - Dashboard statistics
- GET `/api/admin/users` - Get all users with progress (paginated, searchable)
- GET `/api/admin/users/:id` - Get user details
- GET `/api/admin/modules/analytics` - Module performance analytics
- GET `/api/admin/activity` - Recent activity feed

## Project Structure

```
cloudliteracy_edu/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose schemas (User, Module, Payment, Rating, Progress)
│   ├── routes/          # API routes (auth, modules, payments, quiz, ratings, admin, progress)
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & admin access control
│   ├── server.js        # Entry point
│   ├── seedModules.js   # Database seeding script
│   └── createAdmin.js   # Admin user creation script
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Navbar, Footer, DonateModal, ProgressBar
│       ├── pages/       # Home, Login, Register, ModuleList, ModuleDetail, AdminDashboard, etc.
│       ├── services/    # API services (auth, modules, payments, ratings)
│       ├── context/     # AuthContext for user state management
│       └── App.js       # Main app with routing
└── uploads/             # Content storage
    ├── pdfs/
    └── videos/
```

## Getting Started

### Quick Setup (5 minutes)
1. ✅ Install dependencies (backend & frontend)
2. ✅ Setup MongoDB Atlas free tier
3. ✅ Configure Stripe for card payments (minimum requirement)
4. ✅ Seed initial module data
5. ✅ Create admin account: `node backend/createAdmin.js`
6. ✅ Start backend: `npm run dev` (in backend folder)
7. ✅ Start frontend: `npm start` (in frontend folder)

### Admin Access
- Email: `admin@cloudliteracy.com`
- Password: `admin123`
- Access admin dashboard at: http://localhost:3000/admin

### Next Steps
1. 📝 Upload your Pre-DevOps course content (PDFs, videos)
2. 📝 Add quiz questions to modules
3. 📝 Test complete user flow: Register → Browse → Pay → Learn → Track Progress
4. 📝 Test admin dashboard features
5. 🔄 Setup MTN MoMo & Orange Money (optional, for mobile money)
6. 🚀 Deploy to production

## Payment Integration Status

- ✅ Stripe (Visa/Mastercard) - Ready (requires API keys)
- ✅ PayPal - Ready (requires API keys)
- ⏳ MTN Mobile Money - Framework ready (requires account approval - can take days/weeks)
- ⏳ Orange Money - Framework ready (requires merchant account - can take weeks)

## Important Notes

### For Immediate Testing:
- **MongoDB Atlas**: Free tier is sufficient for development and small-scale production
- **Stripe**: Test mode works immediately, no business verification needed for testing
- **PayPal**: Sandbox mode available immediately

### For Production in Cameroon:
- **Stripe**: Requires business verification for live payments
- **MTN MoMo**: Requires approval from MTN (register at momodeveloper.mtn.com)
- **Orange Money**: Requires merchant agreement with Orange Cameroon
- Both mobile money options require business registration in Cameroon

### Recommended Setup Order:
1. Start with MongoDB Atlas + Stripe (can test immediately)
2. Add PayPal if needed
3. Apply for MTN MoMo and Orange Money in parallel (they take time)
4. While waiting for mobile money approval, upload your content and test with Stripe

## License

Proprietary - All rights reserved
