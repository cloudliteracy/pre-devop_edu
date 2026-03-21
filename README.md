# CloudLiteracy - DevOps Educational Platform

A full-stack educational platform for pre-DevOps learning with payment integration for MTN Mobile Money, Orange Money, Visa/Mastercard, and PayPal.

## Features

- 7 DevOps learning modules
- PDF and video content per module
- Interactive quizzes with scoring
- Multi-payment gateway support (MTN MoMo, Orange Money, Stripe, PayPal)
- User authentication and authorization
- Module access control based on payment

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
- POST `/api/payments/initiate` - Initiate payment
- GET `/api/payments/verify/:id` - Verify payment status

### Quiz
- GET `/api/quiz/:moduleId` - Get quiz (requires auth + payment)
- POST `/api/quiz/:moduleId/submit` - Submit quiz answers

## Project Structure

```
cloudliteracy_edu/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & access control
│   └── server.js        # Entry point
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       ├── services/    # API services
│       ├── context/     # React context
│       └── App.js       # Main app
└── uploads/             # Content storage
    ├── pdfs/
    └── videos/
```

## Next Steps

1. ✅ Install dependencies (backend & frontend)
2. ✅ Setup MongoDB Atlas free tier
3. ✅ Configure Stripe for card payments (minimum requirement)
4. ✅ Seed initial module data
5. 📝 Upload your DevOps course content (PDFs, videos)
6. 📝 Add quiz questions to modules
7. 🔄 Setup MTN MoMo & Orange Money (optional, for mobile money)
8. 🚀 Test payment flows
9. 🚀 Deploy to production

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
