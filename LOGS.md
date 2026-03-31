# Audit Logs & Database Query Documentation

## Overview
This document provides instructions for querying audit logs, checking partner activity, investigating deletions, and monitoring admin actions in the CloudLiteracy platform.

---

## Table of Contents
1. [Audit Log System](#audit-log-system)
2. [Quick Query Scripts](#quick-query-scripts)
3. [API Endpoints](#api-endpoints)
4. [Manual Database Queries](#manual-database-queries)
5. [Common Investigation Scenarios](#common-investigation-scenarios)

---

## Audit Log System

### Tracked Actions
The system now tracks the following actions:
- `LOGIN_ATTEMPT` - Admin login attempts
- `LOCATION_UPDATE` - Admin authorized country changes
- `USER_DELETE` - Regular user deletions
- `PARTNER_DELETE` - Partner user deletions
- `ADMIN_DELETE` - Admin deletions
- `USER_SUSPEND` - User suspension/unsuspension
- `PARTNER_SUSPEND` - Partner suspension/unsuspension
- `ADMIN_SUSPEND` - Admin suspension/unsuspension
- `PARTNER_CODE_GENERATE` - Partner access code generation
- `PARTNER_CODE_REVOKE` - Partner access code revocation

### Audit Log Fields
```javascript
{
  adminId: ObjectId,           // Who performed the action
  action: String,              // Action type (see above)
  targetUserId: ObjectId,      // User affected by the action
  targetUserEmail: String,     // Email of affected user
  targetUserName: String,      // Name of affected user
  ip: String,                  // IP address (if available)
  country: String,             // Country (if available)
  details: String,             // Detailed description
  createdAt: Date             // Timestamp
}
```

---

## Quick Query Scripts

### 1. Check Recent Partner Activity
**Purpose:** View all partner-related actions in the last 24 hours

```bash
cd backend
node checkPartnerActivity.js
```

**Output:**
- Partner deletions, suspensions, code generations/revocations
- Current partners in database
- Partner count and details

---

### 2. Investigate Partner Data & Revenue
**Purpose:** Find missing partners, check payments, identify deleted users

```bash
cd backend
node investigatePartners.js
```

**Output:**
- Total completed payments and revenue
- Partner package purchases breakdown
- Users with partner data (role, tier, access code)
- Payments with deleted users
- Revenue from deleted partners

---

### 3. Check Admin Activity
**Purpose:** View all admin users and their login history

```bash
cd backend
node checkAdminActivity.js
```

**Output:**
- All admin users (regular, super admin, primary super admin)
- Login attempts for today
- Admin permissions and creation dates

---

## API Endpoints

### Get Audit Logs for Specific Admin
**Endpoint:** `GET /api/admin/audit-logs/:adminId`

**Authentication:** Super Admin only

**Parameters:**
- `adminId` - Admin user ID (use "all" for all admins)
- `limit` - Number of logs to return (default: 50)

**Example:**
```javascript
const token = localStorage.getItem('token');
const response = await axios.get(
  'http://localhost:5000/api/admin/audit-logs/all?limit=100',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

### Get Recent Audit Logs
**Endpoint:** `GET /api/admin/audit-logs-recent`

**Authentication:** Super Admin only

**Query Parameters:**
- `hours` - Time window in hours (default: 24)
- `action` - Filter by specific action type (optional)

**Examples:**

Get all logs from last 24 hours:
```javascript
const response = await axios.get(
  'http://localhost:5000/api/admin/audit-logs-recent',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

Get partner deletions from last 48 hours:
```javascript
const response = await axios.get(
  'http://localhost:5000/api/admin/audit-logs-recent?hours=48&action=PARTNER_DELETE',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

Get all partner-related actions from last week:
```javascript
const actions = ['PARTNER_DELETE', 'PARTNER_SUSPEND', 'PARTNER_CODE_GENERATE', 'PARTNER_CODE_REVOKE'];
for (const action of actions) {
  const response = await axios.get(
    `http://localhost:5000/api/admin/audit-logs-recent?hours=168&action=${action}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(`${action}:`, response.data);
}
```

---

## Manual Database Queries

### Connect to MongoDB
```bash
# Using MongoDB Compass (GUI)
# Connection String: mongodb+srv://cloudliteracy:<password>@cluster0.xxxxx.mongodb.net/cloudliteracy

# Using MongoDB Shell
mongosh "mongodb+srv://cloudliteracy:<password>@cluster0.xxxxx.mongodb.net/cloudliteracy"
```

---

### Query 1: Find All Partner Deletions
```javascript
db.auditlogs.find({
  action: "PARTNER_DELETE"
}).sort({ createdAt: -1 })
```

---

### Query 2: Find All Actions by Specific Admin
```javascript
// Replace with actual admin email
db.auditlogs.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "adminId",
      foreignField: "_id",
      as: "admin"
    }
  },
  {
    $match: {
      "admin.email": "admin@cloudliteracy.com"
    }
  },
  {
    $sort: { createdAt: -1 }
  }
])
```

---

### Query 3: Find All Completed Partner Payments
```javascript
db.payments.find({
  status: "completed",
  isPartnerPurchase: true
}).sort({ createdAt: -1 })
```

---

### Query 4: Find Payments with Deleted Users
```javascript
db.payments.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  {
    $match: {
      user: { $size: 0 },
      status: "completed"
    }
  },
  {
    $project: {
      amount: 1,
      isPartnerPurchase: 1,
      partnerTier: 1,
      paymentMethod: 1,
      createdAt: 1
    }
  }
])
```

---

### Query 5: Find All Current Partners
```javascript
db.users.find({
  $or: [
    { role: "partner" },
    { partnerTier: { $exists: true, $ne: null } }
  ]
}).sort({ createdAt: -1 })
```

---

### Query 6: Calculate Total Revenue by Category
```javascript
db.payments.aggregate([
  {
    $match: { status: "completed" }
  },
  {
    $group: {
      _id: {
        isPartnerPurchase: "$isPartnerPurchase",
        partnerTier: "$partnerTier"
      },
      totalRevenue: { $sum: "$amount" },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { totalRevenue: -1 }
  }
])
```

---

### Query 7: Find Admin Login History (Last 7 Days)
```javascript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

db.auditlogs.find({
  action: "LOGIN_ATTEMPT",
  createdAt: { $gte: sevenDaysAgo }
}).sort({ createdAt: -1 })
```

---

### Query 8: Find All Super Admins
```javascript
db.users.find({
  $or: [
    { isSuperAdmin: true },
    { isPrimarySuperAdmin: true }
  ]
}).sort({ createdAt: -1 })
```

---

## Common Investigation Scenarios

### Scenario 1: Partners Disappeared from Dashboard
**Steps:**
1. Run investigation script:
   ```bash
   cd backend
   node investigatePartners.js
   ```

2. Check for:
   - Payments with deleted users
   - Total partner revenue vs current partners
   - When deletions occurred

3. Check audit logs:
   ```bash
   node checkPartnerActivity.js
   ```

4. Identify who had admin access during deletion timeframe:
   ```bash
   node checkAdminActivity.js
   ```

---

### Scenario 2: Suspicious Admin Activity
**Steps:**
1. Get all admin users:
   ```bash
   node checkAdminActivity.js
   ```

2. Check specific admin's actions via API:
   ```javascript
   GET /api/admin/audit-logs/:adminId?limit=100
   ```

3. Filter by action type:
   ```javascript
   GET /api/admin/audit-logs-recent?hours=168&action=USER_DELETE
   ```

---

### Scenario 3: Revenue Doesn't Match Partner Count
**Steps:**
1. Run investigation:
   ```bash
   node investigatePartners.js
   ```

2. Look for "PAYMENTS WITH DELETED USERS" section

3. Cross-reference with audit logs:
   ```bash
   node checkPartnerActivity.js
   ```

4. Calculate lost revenue:
   ```javascript
   // In investigatePartners.js output
   // Partner Revenue - (Current Partners * Tier Price) = Lost Revenue
   ```

---

### Scenario 4: Track Specific Partner's History
**Manual Query:**
```javascript
// Find partner by email
const partner = db.users.findOne({ email: "partner@example.com" });

// Find their payments
db.payments.find({ userId: partner._id });

// Find audit logs related to them
db.auditlogs.find({ targetUserId: partner._id });
```

---

## Creating Custom Query Scripts

### Template for New Investigation Script
```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Payment = require('./models/Payment');
const AuditLog = require('./models/AuditLog');

async function customInvestigation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Your custom queries here
    const results = await AuditLog.find({
      action: 'PARTNER_DELETE',
      createdAt: { $gte: new Date('2026-03-26') }
    }).populate('adminId', 'name email');

    console.log('Results:', results);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

customInvestigation();
```

**Save as:** `backend/customQuery.js`

**Run:**
```bash
cd backend
node customQuery.js
```

---

## Best Practices

### 1. Regular Monitoring
- Run `checkPartnerActivity.js` daily
- Review audit logs weekly
- Monitor revenue vs partner count monthly

### 2. Before Major Actions
- Always check who is logged in
- Document actions in external log
- Take database backup before bulk operations

### 3. Investigation Protocol
1. Run all three investigation scripts
2. Document findings
3. Check audit logs for timeframe
4. Identify responsible admin
5. Review admin permissions

### 4. Data Retention
- Audit logs are permanent (never auto-deleted)
- Payments are permanent (even if user deleted)
- User data can be recovered from payment records

---

## Troubleshooting

### Script Won't Run
```bash
# Install dependencies
cd backend
npm install

# Check .env file exists
ls -la .env

# Verify MongoDB connection string
cat .env | grep MONGODB_URI
```

### No Audit Logs Found
- Audit logging was implemented on March 31, 2026
- Actions before this date are NOT logged
- Only LOGIN_ATTEMPT and LOCATION_UPDATE existed before

### Connection Errors
```bash
# Test MongoDB connection
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"

# Verify network access
ping cluster0.xxxxx.mongodb.net
```

---

## Emergency Recovery

### If Partners Were Accidentally Deleted

**Option 1: Restore from Payment Records**
```javascript
// Find deleted partner payments
const deletedPartners = await Payment.find({
  isPartnerPurchase: true,
  status: 'completed'
}).populate('userId');

// Identify which users are missing
const missingPartners = deletedPartners.filter(p => !p.userId);

// Contact users via payment email (if stored) or manual recovery
```

**Option 2: Database Backup Restore**
- Contact MongoDB Atlas support
- Request point-in-time recovery
- Restore to before deletion occurred

---

## Support & Maintenance

### Adding New Audit Actions
1. Update `backend/models/AuditLog.js` enum
2. Add logging in relevant controller
3. Update this documentation

### Modifying Query Scripts
- All scripts are in `backend/` directory
- Scripts ending with `.js` are executable
- Always test on development database first

---

## Quick Reference Commands

```bash
# Check partner activity (last 24h)
node backend/checkPartnerActivity.js

# Investigate missing partners
node backend/investigatePartners.js

# Check admin logins
node backend/checkAdminActivity.js

# Custom query
node backend/customQuery.js
```

---

## Contact & Support
For issues with audit logs or investigations:
1. Check this documentation first
2. Review script output carefully
3. Check MongoDB Atlas logs
4. Contact system administrator

---

**Last Updated:** March 31, 2026  
**Version:** 1.0  
**Maintained By:** CloudLiteracy Development Team
