# CSR Renewable Access & User Expulsion System

## Implementation Summary

### Features Implemented

#### 1. **Custom CSR Access Duration**
- Super admin sets access duration when generating CSR codes (1-60 months)
- Each CSR code can have different access durations
- Default: 12 months if not specified
- Users see duration in registration success message

#### 2. **Renewable CSR Access**
- CSR users get free access based on code's duration setting
- Access expiration is tracked via `csrAccessExpiresAt` field in User model
- Super admin can renew access for 3, 6, or 12 months at a time
- Expired CSR users lose free access but account remains (can purchase modules like regular users)

#### 3. **CSR User Expulsion**
- Super admin can permanently delete CSR users for misconduct
- Deletion removes user completely from database
- Confirmation dialog prevents accidental deletion

#### 4. **Visual Indicators**
- Color-coded expiration dates:
  - 🔴 Red: Less than 30 days until expiry
  - 🟠 Orange: 30-90 days until expiry
  - 🟢 Green: More than 90 days until expiry
- Days remaining shown in parentheses
- "EXPIRED" label for expired access
- Access duration displayed on each CSR code

---

## Backend Changes

### Database Schema (CSRCode Model)
```javascript
accessDurationMonths: { type: Number, required: true, min: 1, default: 12 }
```

### Database Schema (User Model)
```javascript
csrAccessExpiresAt: { type: Date }           // Expiration date for CSR access
csrAccessRenewedBy: { type: ObjectId }       // Admin who renewed access
csrAccessRenewedAt: { type: Date }           // Last renewal timestamp
```

### New API Endpoints

#### Generate CSR Code
```
POST /api/csr/generate
Body: { 
  expiresAt: Date,
  maxUses: Number,
  accessDurationMonths: Number  // NEW: 1-60 months
}
Auth: Super Admin only
```

#### Renew CSR Access
```
PUT /api/csr/users/:userId/renew
Body: { months: 3 | 6 | 12 }
Auth: Super Admin only
```

#### Expel CSR User
```
DELETE /api/csr/users/:userId/expel
Auth: Super Admin only
```

### Updated Logic

**Registration (authController.js):**
- Calculates expiration based on code's `accessDurationMonths` field
- Formula: `Date.now() + (accessDurationMonths * 30 * 24 * 60 * 60 * 1000)`
- Success message includes duration: "You now have free access for X months"

**Access Verification (verifyAccess.js):**
- Checks if CSR user's access has expired
- Expired CSR users treated as regular users (must pay)

**Analytics (csrController.js):**
- Includes `csrAccessExpiresAt` in recent users response

---

## Frontend Changes

### CSR Management Component

#### CSR Code Generation Form
- Three required fields:
  1. **Expiration Date**: When code expires (can't be used for new registrations)
  2. **Maximum Uses**: How many users can register with this code
  3. **Access Duration**: How many months of free access (1-60 months)
- Default duration: 12 months
- Helper text: "How long users get free access (1-60 months)"

#### CSR Code Display
- Shows access duration in gold color
- Format: "12 months", "6 months", etc.

#### Recent CSR Registrations Table
- Shows all CSR users with expiration dates
- Color-coded expiration indicators
- Action buttons for each user

#### Renew Access Dropdown
- Options: +3 months, +6 months, +12 months
- Extends expiration from current date or existing expiry (whichever is later)
- Success message confirms renewal

#### Delete Button
- Red button with trash icon
- Double confirmation dialog with warning
- Permanently removes user from platform

---

## User Flow Examples

### Scenario 1: New CSR Registration with Custom Duration
1. Super admin generates CSR code with 6 months access duration
2. User enters code during registration
3. System sets `isCsrUser: true` and `csrAccessExpiresAt: 6 months from now`
4. User sees: "CSR registration successful! You now have free access to all modules for 6 months."
5. User gets free access to all modules for 6 months

### Scenario 2: Different Codes, Different Durations
1. Super admin creates Code A: 3 months access (for trial users)
2. Super admin creates Code B: 24 months access (for partners)
3. Users registering with Code A get 3 months free access
4. Users registering with Code B get 24 months free access

### Scenario 3: Access Expiration
1. CSR user's access expires after their code's duration (e.g., 6 months)
2. User can still login but must pay for modules like regular users
3. Super admin can renew access to restore free access

### Scenario 4: Access Renewal
1. Super admin views CSR users in dashboard
2. Sees user with 20 days until expiry (red indicator)
3. Selects "+6 Months" from dropdown
4. User's expiration extended by 6 months from current expiry date

### Scenario 5: User Expulsion
1. CSR user violates platform rules
2. Super admin clicks "Delete" button next to user's name
3. Confirms deletion in warning dialog
4. User account permanently deleted from database

---

## Security Features

- ✅ Only super admin can renew or expel CSR users
- ✅ Expired CSR users automatically lose free access
- ✅ Confirmation dialogs prevent accidental deletions
- ✅ Audit trail with `csrAccessRenewedBy` and `csrAccessRenewedAt`
- ✅ Real-time access verification on every module request

---

## Testing Checklist

### Backend Testing
- [ ] CSR code generation requires accessDurationMonths field
- [ ] CSR user registration sets expiration based on code's duration
- [ ] Registration success message shows correct duration
- [ ] Expired CSR users cannot access modules without payment
- [ ] Super admin can renew access (3/6/12 months)
- [ ] Super admin can delete CSR users
- [ ] Regular admins cannot renew/expel users
- [ ] Analytics includes expiration dates
- [ ] Different codes can have different durations

### Frontend Testing
- [ ] Code generation form has access duration field (1-60 months)
- [ ] Default duration is 12 months
- [ ] Access duration displays on each code card
- [ ] Expiration dates display with correct colors
- [ ] Renew dropdown extends access correctly
- [ ] Delete button shows confirmation dialog
- [ ] Success/error messages display properly
- [ ] Table responsive on mobile devices

---

## Future Enhancements (Optional)

1. **Email Notifications**
   - Send reminder emails 30 days before expiry
   - Notify user when access expires
   - Confirm renewal via email

2. **Bulk Operations**
   - Renew multiple users at once
   - Export CSR user list to CSV

3. **Access History**
   - Track all renewals and expirations
   - Show renewal history per user

4. **Grace Period**
   - Allow 7-day grace period after expiration
   - Soft warning before hard cutoff

---

## Files Modified

### Backend
- `backend/models/CSRCode.js` - Added accessDurationMonths field
- `backend/models/User.js` - Added expiration fields
- `backend/controllers/authController.js` - Calculate expiration from code duration
- `backend/controllers/csrController.js` - Added renew and expel functions, updated generate to accept duration
- `backend/middleware/verifyAccess.js` - Check expiration before granting access
- `backend/routes/csr.js` - Added renew and expel routes

### Frontend
- `frontend/src/components/CSRManagement.js` - Added table with actions
- `frontend/src/components/CSRManagement.css` - Styled table and buttons

---

## Summary

The CSR Renewable Access system provides super admins with complete control over CSR user access:

- **Custom Duration**: Set access duration per code (1-60 months)
- **Flexible Codes**: Different codes can have different durations (trial vs partner)
- **Automatic Expiration**: Access expires based on code's duration setting
- **Flexible Renewal**: Extend access by 3, 6, or 12 months
- **User Expulsion**: Permanently remove users for misconduct
- **Visual Indicators**: Color-coded expiration warnings
- **Secure**: Super admin only, with confirmation dialogs

This ensures the CSR program remains manageable while preventing abuse and maintaining platform integrity.
