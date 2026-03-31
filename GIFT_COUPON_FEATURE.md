# Gift Coupon Feature - Implementation Guide

## Overview

Users can now **gift their reward coupons** to other users! This feature allows you to transfer ownership of your 20% discount coupons to friends, family, or anyone with a CloudLiteracy account.

## Features Implemented

### 1. Backend Changes

#### Updated Coupon Model (`backend/models/Coupon.js`)
Added new fields to track gifting:
```javascript
{
  isGifted: Boolean,        // Whether coupon was gifted
  giftedFrom: ObjectId,     // Original owner
  giftedTo: ObjectId,       // New owner
  giftedAt: Date           // When it was gifted
}
```

#### New API Endpoint (`backend/routes/referrals.js`)
**POST `/api/referrals/gift-coupon`**

**Request:**
```json
{
  "couponId": "67abc123...",
  "recipientEmail": "friend@example.com"
}
```

**Response:**
```json
{
  "message": "Coupon REF123456 successfully gifted to John Doe!",
  "coupon": {
    "code": "REF123456",
    "discountPercent": 20,
    "recipientName": "John Doe",
    "recipientEmail": "friend@example.com"
  }
}
```

**Validations:**
- ✅ Coupon must exist
- ✅ User must own the coupon
- ✅ Coupon must not be used
- ✅ Coupon must not be expired
- ✅ Coupon must not be already gifted
- ✅ Recipient must have an account
- ✅ Cannot gift to yourself

### 2. Frontend Changes

#### Updated Referral Dashboard (`frontend/src/pages/ReferralDashboard.js`)

**New UI Elements:**
- 🎁 **Gift Button** on each coupon
- 📧 **Email Input Form** for recipient
- ✅ **Success Message** after gifting
- ❌ **Error Handling** for validation failures
- 🔄 **Auto-refresh** coupon list after gifting

**User Flow:**
1. Click "🎁 Gift" button on any coupon
2. Enter recipient's email address
3. Click "💌 Send Gift"
4. Coupon transfers to recipient
5. Success message displayed
6. Coupon removed from your list

## How to Use

### As a Gifter (Sender)

1. **Go to Referral Dashboard**
   - Navigate to: http://localhost:3000/referrals
   - View your available coupons

2. **Select Coupon to Gift**
   - Click "🎁 Gift" button on desired coupon
   - Gift form appears

3. **Enter Recipient Email**
   - Type recipient's email (must be registered user)
   - Example: `friend@example.com`

4. **Send Gift**
   - Click "💌 Send Gift" button
   - Wait for confirmation

5. **Confirmation**
   - Success message: "Coupon REF123456 successfully gifted to John Doe!"
   - Coupon disappears from your list
   - Recipient can now see it in their dashboard

### As a Recipient

1. **Receive Notification**
   - Currently: Check your Referral Dashboard
   - Future: Email notification (to be implemented)

2. **View Gifted Coupon**
   - Go to Referral Dashboard
   - See coupon in "My Reward Coupons" section
   - Badge shows: "🎁 Received as gift"

3. **Use Coupon**
   - Copy coupon code
   - Apply during checkout
   - Get 20% discount on purchase

## Validation Rules

### Coupon Eligibility
A coupon can be gifted if:
- ✅ Not used
- ✅ Not expired
- ✅ Not already gifted
- ✅ You are the owner

### Recipient Requirements
Recipient must:
- ✅ Have a CloudLiteracy account
- ✅ Be a different user (not yourself)
- ✅ Have valid email address

### One-Time Transfer
- ⚠️ Gifting is **permanent** and **irreversible**
- ⚠️ Recipient **cannot re-gift** the coupon
- ⚠️ You **cannot take it back** after gifting

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Coupon not found" | Invalid coupon ID | Check coupon exists |
| "You do not own this coupon" | Not your coupon | Can only gift your own coupons |
| "Coupon already used" | Already redeemed | Cannot gift used coupons |
| "Coupon already gifted" | Previously gifted | Each coupon can only be gifted once |
| "Coupon has expired" | Past expiry date | Cannot gift expired coupons |
| "Recipient user not found" | Email not registered | Recipient must create account first |
| "Cannot gift to yourself" | Same user | Enter different email |

## Database Changes

### Before Gifting
```javascript
{
  _id: ObjectId("67abc..."),
  userId: ObjectId("USER_A"),  // Your ID
  code: "REF123456",
  discountPercent: 20,
  isUsed: false,
  isGifted: false,
  expiresAt: ISODate("2025-04-15")
}
```

### After Gifting
```javascript
{
  _id: ObjectId("67abc..."),
  userId: ObjectId("USER_B"),      // Recipient's ID (changed)
  code: "REF123456",
  discountPercent: 20,
  isUsed: false,
  isGifted: true,                  // Marked as gifted
  giftedFrom: ObjectId("USER_A"),  // Your ID
  giftedTo: ObjectId("USER_B"),    // Recipient's ID
  giftedAt: ISODate("2025-01-15"), // Gift timestamp
  expiresAt: ISODate("2025-04-15")
}
```

## Testing Guide

### Test Case 1: Successful Gift
1. Login as User A
2. Go to Referral Dashboard
3. Click "Gift" on a coupon
4. Enter User B's email
5. Click "Send Gift"
6. **Expected**: Success message, coupon removed from list
7. Login as User B
8. Go to Referral Dashboard
9. **Expected**: Coupon appears with "🎁 Received as gift" badge

### Test Case 2: Gift to Non-Existent User
1. Click "Gift" on coupon
2. Enter `nonexistent@example.com`
3. Click "Send Gift"
4. **Expected**: Error "Recipient user not found"

### Test Case 3: Gift to Self
1. Click "Gift" on coupon
2. Enter your own email
3. Click "Send Gift"
4. **Expected**: Error "Cannot gift to yourself"

### Test Case 4: Gift Already Gifted Coupon
1. Gift coupon to User B
2. Login as User B
3. Try to gift same coupon to User C
4. **Expected**: Error "Coupon already gifted"

### Test Case 5: Gift Expired Coupon
1. Wait for coupon to expire (or manually set expiry in DB)
2. Try to gift expired coupon
3. **Expected**: Error "Coupon has expired"

## Use Cases

### Scenario 1: Sharing with Friends
**Situation**: You have 2 coupons but only need 1
**Action**: Gift the extra coupon to a friend
**Benefit**: Friend gets 20% discount, you help them save money

### Scenario 2: Team Rewards
**Situation**: You're a team lead, earned multiple coupons
**Action**: Gift coupons to team members
**Benefit**: Boost team morale, encourage learning

### Scenario 3: Family Sharing
**Situation**: Family member wants to join CloudLiteracy
**Action**: Gift them a coupon for their first purchase
**Benefit**: They get discount, you help family learn

### Scenario 4: Community Building
**Situation**: Active in DevOps community
**Action**: Gift coupons to community members
**Benefit**: Grow CloudLiteracy user base, help community

## Future Enhancements

### Phase 2 (Optional)
- [ ] Email notification to recipient
- [ ] Gift message/note from sender
- [ ] Gift history/log in dashboard
- [ ] Ability to decline/return gift
- [ ] Gift expiry (must accept within X days)

### Phase 3 (Optional)
- [ ] Gift multiple coupons at once
- [ ] Gift to multiple recipients
- [ ] Schedule gift for future date
- [ ] Gift wrapping/custom design
- [ ] Social sharing of gifts

## API Reference

### Gift Coupon Endpoint

**Endpoint**: `POST /api/referrals/gift-coupon`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "couponId": "string (required)",
  "recipientEmail": "string (required, valid email)"
}
```

**Success Response** (200):
```json
{
  "message": "Coupon REF123456 successfully gifted to John Doe!",
  "coupon": {
    "code": "REF123456",
    "discountPercent": 20,
    "recipientName": "John Doe",
    "recipientEmail": "friend@example.com"
  }
}
```

**Error Responses**:
- **400**: Validation error (missing fields, invalid coupon state)
- **403**: Unauthorized (not coupon owner)
- **404**: Coupon or recipient not found
- **500**: Server error

## Security Considerations

### Ownership Verification
- Backend verifies user owns coupon before gifting
- Cannot gift someone else's coupon
- JWT token required for authentication

### Fraud Prevention
- One-time gifting only (cannot re-gift)
- Cannot gift to self
- Cannot gift used/expired coupons
- Audit trail (giftedFrom, giftedTo, giftedAt)

### Data Integrity
- Atomic database operations
- Transaction-safe coupon transfer
- No data loss during gifting

## Troubleshooting

### Issue: "Recipient not found"
**Cause**: Email not registered
**Solution**: Ask recipient to create account first

### Issue: Gift button not appearing
**Cause**: Coupon already used/expired/gifted
**Solution**: Check coupon status, only valid coupons can be gifted

### Issue: Success message but coupon still visible
**Cause**: Frontend cache not refreshed
**Solution**: Refresh page manually, or wait for auto-refresh

### Issue: Recipient doesn't see coupon
**Cause**: Wrong email entered, or recipient not logged in
**Solution**: Verify email, ask recipient to refresh dashboard

## Summary

✅ **Feature Complete**: Gift coupon functionality fully implemented
✅ **User-Friendly**: Simple 3-step process to gift coupons
✅ **Secure**: Ownership verification and validation checks
✅ **Tracked**: Full audit trail of gifting history
✅ **Flexible**: Gift any unused, non-expired coupon

Now you can share your rewards with friends and help them save money on CloudLiteracy courses! 🎁
