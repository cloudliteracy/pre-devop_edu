# Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] MongoDB Atlas account created
- [ ] Stripe account created (minimum requirement)
- [ ] Git Bash or terminal ready

---

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Setup MongoDB Atlas (Cloud - FREE)

### Create MongoDB Atlas Account:

1. **Sign Up:**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up with email or use Google/GitHub login

2. **Create Free Cluster:**
   - Choose **FREE** tier (M0 Sandbox - 512MB storage)
   - Select cloud provider: AWS, Google Cloud, or Azure
   - Choose region closest to you (Europe or Middle East for Cameroon)
   - Cluster name: Keep default or name it `cloudliteracy`
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Create Database User:**
   - Click "Database Access" in left sidebar
   - Click Database Access "Add New Database User"
   - Authentication Method: **Password**
   - Username: `cloudliteracy`
   - Password: Click "Autogenerate Secure Password" (SAVE THIS PASSWORD!)
   - Database User Privileges: **Atlas admin**
   - Click "Add User"

4. **Whitelist IP Address:**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" button
   - This adds `0.0.0.0/0` (allows connections from any IP)
   - Click "Confirm"

5. **Get Connection String:**
   - Click "Database" in left sidebar
   - Click Cluster and "Connect" button 
   - Choose "Connect your application"
   - Driver: Node.js, Version: 4.1 or later
   - Install your driver
  
       - Run the following on the command line
            npm install mongodb
   - Copy the connection string:
   ```
   mongodb+srv://cloudliteracy:<password>@cluster0.xxxxx.mongodb.net/
   ```
   - Replace `<password>` with the password you saved earlier
   - Add database name at the end: `...mongodb.net/cloudliteracy`

**Final connection string should look like:**
```
mongodb+srv://cloudliteracy:YourPassword123@cluster0.abc123.mongodb.net/cloudliteracy
```

---

## Step 2b: Setup Payment Gateways

### Generate the JWT_SECRET
To generate a secure JWT secret key, you can use the following command in your terminal (recommended approach)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
This will output a random 64-character hexadecimal string that you can use as your `JWT_SECRET` in the `.env` file.



### Stripe (REQUIRED - Visa/Mastercard):

1. Go to https://dashboard.stripe.com/register
2. Sign up with your email
3. Complete registration (you can skip business details for testing)
4. Go to **Developers** → **API Keys** (left sidebar)
5. You'll see two keys:
   - **Publishable key**: `pk_test_...` (visible)
   - **Secret key**: Click "Reveal test key" to see `sk_test_...`
6. **SAVE BOTH KEYS** - you'll need them for `.env` file

### PayPal (OPTIONAL):

1. Go to https://developer.paypal.com/
2. Log in with PayPal account (or create one)
3. Go to **Dashboard** → **My Apps & Credentials**
4. Click **Create App**
5. App Name: `CloudLiteracy`
6. Click **Create App**
7. You'll get:
   - **Client ID**: (visible)
   - **Secret**: Click "Show" to reveal
8. **SAVE BOTH** - these are sandbox credentials

### MTN Mobile Money (OPTIONAL - Takes time):

1. Go to https://momodeveloper.mtn.com/
2. Click "Sign Up" and complete registration
3. Go to **Products** → Subscribe to "Collection" product
4. Go to **Subscriptions** to get your Primary Key
5. Note: Full setup requires API user creation (technical)
6. **Approval can take days/weeks**

### Orange Money (OPTIONAL - Takes weeks):

1. Contact Orange Cameroon business team
2. Visit Orange shop or call business line
3. Request "Orange Money API for Merchants"
4. Requires business registration documents
5. **Approval can take weeks**

---

## Step 3: Configure Environment Variables

1. Navigate to backend folder:
```bash
cd backend
```

2. Copy `.env.example` to `.env`:
```bash
copy .env.example .env   # for Windows
cp .env.example .env   # for linux (git bash)
nano .env   # edit your credentials
```

3. Open `.env` file in a text editor and update with your credentials:

```env
# Server
PORT=5000

# MongoDB Atlas Connection (REQUIRED)
MONGODB_URI=mongodb+srv://cloudliteracy:YourPassword123@cluster0.xxxxx.mongodb.net/cloudliteracy

# JWT Secret (REQUIRED - generate a random string)
JWT_SECRET=your_super_secret_random_key_at_least_32_characters_long

# Stripe (REQUIRED for card payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# PayPal (OPTIONAL)
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_MODE=sandbox

# MTN Mobile Money (OPTIONAL - leave as is if not ready)
MTN_MOMO_API_KEY=your_mtn_api_key
MTN_MOMO_USER_ID=your_mtn_user_id
MTN_MOMO_SUBSCRIPTION_KEY=your_mtn_subscription_key
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com

# Orange Money (OPTIONAL - leave as is if not ready)
ORANGE_MONEY_API_KEY=your_orange_api_key
ORANGE_MONEY_MERCHANT_ID=your_orange_merchant_id
ORANGE_MONEY_BASE_URL=https://api.orange.com/orange-money-webpay

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Minimum Required for Testing:**
- `MONGODB_URI` or `db connection string` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Any random string (32+ characters)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

**To generate JWT_SECRET, you can use:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Seed Initial Data

```bash
cd backend
node seedModules.js
```

This creates 7 Pre-DevOps modules in your database.

## Step 4b: Create Admin Account

```bash
cd backend
node createAdmin.js
```

This creates an admin user with:
- Email: `admin@cloudliteracy.com`
- Password: `admin123`
- Role: `admin`

**Important:** Change the admin password after first login in production!

## Step 5: Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Server runs on http://localhost:5000

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```
App opens at http://localhost:3000

## Step 6: Test the Application

### User Flow:
1. Open http://localhost:3000
2. Click "Register" to create an account
3. Browse Pre-DevOps Learning Modules
4. Try payment flow with Stripe test cards:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
5. Access purchased module content
6. Track your progress (videos, PDFs, quizzes)
7. Rate the platform (5-star rating on home page)
8. Try the Donate feature in footer

### Admin Flow:
1. Login with admin credentials:
   - Email: `admin@cloudliteracy.com`
   - Password: `admin123`
2. Access Admin Dashboard at http://localhost:3000/admin
3. View Overview tab (stats, recent activity)
4. Check Users tab (search, view progress, expand details)
5. Review Analytics tab (module performance)

## Key Features Implemented

### 🎯 User Features
- **Progress Tracking**: Automatic tracking of videos watched (40%), PDFs downloaded (30%), and quiz completion (30%)
- **Color-Coded Progress**: Red (<30%), Yellow (30-70%), Green (>70%)
- **5-Star Rating System**: Rate the platform on home page (requires login)
- **Donation System**: Support the platform with custom amounts via all payment gateways
- **Black & Gold Theme**: Professional UI with #000000, #1a1a1a backgrounds and #FFD700 accents
- **Enhanced Security**: Password visibility toggle, drag-drop captcha, forgot password
- **Animated Navigation**: Hover effects with glow, color change, and upward movement

### 🛡️ Admin Features
- **Dashboard Overview**: Total users, enrollments, revenue, average completion percentage
- **User Management**: Paginated list with search, view overall progress with color-coded badges
- **Detailed Progress View**: Expandable rows showing per-module breakdown (videos, PDFs, quiz status)
- **Module Analytics**: Performance metrics for each module
- **Recent Activity**: Real-time feed of registrations, payments, and quiz completions
- **Role-Based Access**: Admin link only visible to users with admin role

### 💳 Payment Features
- **Stripe Integration**: Visa/Mastercard payments with test mode
- **PayPal Integration**: Sandbox mode ready
- **MTN Mobile Money**: Framework ready (requires approval)
- **Orange Money**: Framework ready (requires merchant account)
- **Donation Support**: All payment gateways support donations with custom amounts
- **Phone Number Input**: For mobile money payments (MTN, Orange)

## Payment Gateway Setup (Optional)

### Stripe (Visa/Mastercard) - Already configured in Step 2b
✅ Test mode works immediately with the keys you added to `.env`

For live payments:
1. Complete business verification in Stripe Dashboard
2. Switch to live mode and get live API keys
3. Update `.env` with live keys (starts with `pk_live_` and `sk_live_`)

### MTN Mobile Money Cameroon - Advanced Setup
✅ Framework is ready in the code
⏳ Requires MTN approval and technical setup

**Current Status:** Payment initiation returns pending status
**To fully integrate:**
1. Complete registration at https://momodeveloper.mtn.com
2. Get subscription key
3. Create API user via MTN API
4. Implement collection request flow
5. Add webhook for payment confirmation

### Orange Money Cameroon - Advanced Setup
✅ Framework is ready in the code
⏳ Requires Orange merchant account

**Current Status:** Payment initiation returns pending status
**To fully integrate:**
1. Get merchant credentials from Orange Cameroon
2. Implement Orange Money Web Payment API
3. Add payment verification endpoint
4. Configure callback URLs

### PayPal - Already configured if you added credentials
✅ Sandbox mode works with credentials from Step 2b
⏳ Full integration needs additional implementation

**Note:** Mobile money integrations (MTN & Orange) are complex and require:
- Business registration in Cameroon
- API approval (can take weeks)
- Technical implementation of their specific APIs
- Webhook setup for payment confirmation

For now, you can test with **Stripe** which works immediately!

## Troubleshooting

**MongoDB Connection Error:**
- Ensure you copied the connection string correctly
- Check that you replaced `<password>` with actual password
- Verify IP whitelist includes `0.0.0.0/0` in MongoDB Atlas
- Make sure cluster is fully deployed (check Atlas dashboard)

**"Cannot find module" errors:**
- Run `npm install` in both backend and frontend directories
- Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

**Port Already in Use:**
- Change PORT in backend `.env` file
- Update API_URL in frontend `src/services/api.js` to match
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

**Stripe Payment Not Working:**
- Verify you're using TEST mode keys (start with `pk_test_` and `sk_test_`)
- Check keys are correctly added to `.env` file
- Restart backend server after updating `.env`

**Frontend Can't Connect to Backend:**
- Ensure backend is running on port 5000
- Check CORS is enabled in backend (already configured)
- Verify API_URL in `frontend/src/services/api.js` is `http://localhost:5000/api`

**Seed Script Fails:**
- Make sure MongoDB connection is working first
- Check `.env` file has correct MONGODB_URI
- Ensure you're in the `backend` directory when running `node seedModules.js`

## Next Steps

### Immediate (Can do now):
1. ✅ Upload your Pre-DevOps content (PDFs, videos) to `uploads/` folders
2. ✅ Add more quiz questions to each module
3. ✅ Customize styling and branding
4. ✅ Test complete user flow: Register → Browse → Pay → Access content → Track progress
5. ✅ Test admin dashboard: View stats, manage users, check analytics
6. ✅ Test donation feature with all payment gateways
7. ✅ Test rating system (requires login)
8. ✅ Add more modules if needed

### Short-term (This week):
1. 📝 Apply for MTN MoMo developer account
2. 📝 Contact Orange Money for merchant account
3. 📝 Complete Stripe business verification for live payments
4. 📝 Set up proper file storage (AWS S3 or similar for production)
5. 📝 Add email notifications for successful payments

### Before Production:
1. 🚀 Change admin password from default `admin123`
2. 🚀 Implement proper error handling and logging
3. 🚀 Set up proper file storage (AWS S3 or similar for production)
4. 🚀 Add email notifications for successful payments
5. 🚀 Set up SSL certificate (HTTPS)
6. 🚀 Configure production environment variables
7. 🚀 Deploy to cloud hosting (Heroku, AWS, DigitalOcean, etc.)
8. 🚀 Set up backup strategy for MongoDB
9. 🚀 Implement rate limiting and security measures
10. 🚀 Test all payment gateways in production mode

## Support

For issues, check:
- MongoDB is running
- All dependencies installed
- Environment variables configured
- Ports 3000 and 5000 are available
