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
- Role-based access control (user/admin/super admin)
- Black (#000000, #1a1a1a) and gold (#FFD700) themed UI
- Password visibility toggles and drag-drop captcha
- Password reset via email with secure tokens (1-hour expiry)
- 5-star rating system with hover effects
- Responsive navigation with animated hover effects

### Admin Dashboard
- Comprehensive overview with stats cards (users, enrollments, revenue, completion)
- User management with search and pagination
- Detailed user progress tracking with expandable module breakdowns
- Module analytics and performance metrics
- Recent activity feed (registrations, payments, quiz completions)
- Real-time online users tracking with geolocation
- Password change functionality in Settings tab

### Admin Management System (Super Admin Only)
- Create new admins with auto-generated temporary passwords
- Suspend/reinstate admins with real-time access revocation
- Force password change on first login for new admins
- Admin status monitoring and management
- Super admin cannot be suspended

### Additional Pages
- About Us page with mission and vision
- Contact Us page with form submission
- Privacy Policy with comprehensive data protection information

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB
- JWT Authentication
- Socket.io (real-time features)
- Nodemailer (email service)
- Stripe, PayPal, MTN MoMo, Orange Money APIs

**Frontend:**
- React
- React Router
- Axios
- Socket.io-client

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account (free tier)
- Gmail account (for password reset emails)
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

4. Setup Gmail for Password Reset Emails:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification" if not already enabled
   - Go to https://myaccount.google.com/apppasswords
   - Select App: "Mail" and Device: "Other (Custom name)" - type "CloudLiteracy"
   - Click "Generate" and copy the 16-character password
   - Save this for the `.env` file

5. Setup Payment Gateways:

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

6. Create `.env` file (copy from `.env.example`):
```bash
copy .env.example .env
```

7. Update `.env` with your credentials:
```env
# MongoDB
MONGODB_URI=mongodb+srv://cloudliteracy:<password>@cluster0.xxxxx.mongodb.net/cloudliteracy

# JWT
JWT_SECRET=your_random_secret_key_minimum_32_characters

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_FROM=CloudLiteracy <your_email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

8. Seed the database with initial modules:
```bash
node seedModules.js
```

9. Create super admin account:
```bash
node updateSuperAdmin.js
```

10. Start the server:
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
- PUT `/api/auth/change-password` - Change password (requires auth)
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password/:token` - Reset password with token

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
- POST `/api/admin/create-admin` - Create new admin (super admin only)
- GET `/api/admin/admins` - Get all admins (super admin only)
- PUT `/api/admin/admins/:id/toggle-suspension` - Suspend/reinstate admin (super admin only)

## Project Structure

```
cloudliteracy_edu/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose schemas (User, Module, Payment, Rating, Progress)
│   ├── routes/          # API routes (auth, modules, payments, quiz, ratings, admin, progress)
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & admin access control
│   ├── services/        # Email service
│   ├── server.js        # Entry point with Socket.io
│   ├── seedModules.js   # Database seeding script
│   ├── updateSuperAdmin.js  # Super admin setup script
│   └── .env.example     # Environment variables template
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Navbar, Footer, DonateModal, ProgressBar
│       ├── pages/       # Home, Login, Register, ModuleList, ModuleDetail, AdminDashboard, etc.
│       ├── services/    # API services (auth, modules, payments, ratings, socket)
│       ├── context/     # AuthContext for user state management
│       └── App.js       # Main app with routing
└── uploads/             # Content storage
    ├── pdfs/
    └── videos/
```

## Getting Started

### Quick Setup (10 minutes)
1. ✅ Install dependencies (backend & frontend)
2. ✅ Setup MongoDB Atlas free tier
3. ✅ Setup Gmail App Password for email service
4. ✅ Configure Stripe for card payments (minimum requirement)
5. ✅ Seed initial module data
6. ✅ Create super admin account: `node backend/updateSuperAdmin.js`
7. ✅ Start backend: `npm run dev` (in backend folder)
8. ✅ Start frontend: `npm start` (in frontend folder)

### Super Admin Access
- Email: `admin@cloudliteracy.com`
- Password: `admin123`
- Access admin dashboard at: http://localhost:3000/admin

### Admin Management Features
- **Create Admins**: Super admin can create new admins from Admin Management tab
- **Temporary Passwords**: New admins receive auto-generated passwords
- **Force Password Change**: New admins must change password on first login
- **Suspend Admins**: Super admin can suspend/reinstate admins in real-time
- **Real-time Revocation**: Suspended admins are immediately logged out

### Next Steps
1. 📝 Upload your Pre-DevOps course content (PDFs, videos)
2. 📝 Add quiz questions to modules
3. 📝 Test complete user flow: Register → Browse → Pay → Learn → Track Progress
4. 📝 Test password reset functionality
5. 📝 Test admin management features
6. 🔄 Setup MTN MoMo & Orange Money (optional, for mobile money)
7. 🚀 Deploy to production

## Email Service Configuration

### Gmail (Recommended for Testing)
- Free and easy to set up
- Suitable for development and small-scale production
- Daily sending limit: 500 emails

### Production Email Services
For production, consider these alternatives:
- **SendGrid**: Free tier (100 emails/day), easy integration
- **AWS SES**: Very cheap, highly reliable, requires AWS account
- **Mailgun**: Good for high volume, flexible pricing
- **Postmark**: Excellent deliverability, transactional email focused

To switch to custom SMTP, update `.env`:
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=CloudLiteracy <noreply@cloudliteracy.com>
```

## Payment Integration Status

- ✅ Stripe (Visa/Mastercard) - Ready (requires API keys)
- ✅ PayPal - Ready (requires API keys)
- ⏳ MTN Mobile Money - Framework ready (requires account approval - can take days/weeks)
- ⏳ Orange Money - Framework ready (requires merchant account - can take weeks)

## Important Notes

### For Immediate Testing:
- **MongoDB Atlas**: Free tier is sufficient for development and small-scale production
- **Gmail**: Free App Password for email service
- **Stripe**: Test mode works immediately, no business verification needed for testing
- **PayPal**: Sandbox mode available immediately

### For Production in Cameroon:
- **Email**: Consider SendGrid or AWS SES for better deliverability
- **Stripe**: Requires business verification for live payments
- **MTN MoMo**: Requires approval from MTN (register at momodeveloper.mtn.com)
- **Orange Money**: Requires merchant agreement with Orange Cameroon
- Both mobile money options require business registration in Cameroon

### Recommended Setup Order:
1. Start with MongoDB Atlas + Gmail + Stripe (can test immediately)
2. Add PayPal if needed
3. Apply for MTN MoMo and Orange Money in parallel (they take time)
4. While waiting for mobile money approval, upload your content and test with Stripe
5. Before production, switch to professional email service (SendGrid/AWS SES)

## Security Features

- JWT token authentication with 7-day expiry
- Password hashing with bcrypt
- Password reset tokens with 1-hour expiry
- Role-based access control (user/admin/super admin)
- Real-time admin suspension with forced logout
- Secure payment processing through trusted gateways
- Input validation and sanitization

## Real-time Features

- Online users tracking with Socket.io
- Live geolocation display (country and city)
- Real-time progress updates
- Instant admin suspension notifications
- Live activity monitoring

## License

Proprietary - All rights reserved
