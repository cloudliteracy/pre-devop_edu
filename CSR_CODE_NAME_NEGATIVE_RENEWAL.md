# CSR Code Name & Negative Renewal Implementation

## Features Implemented

### 1. **CSR Code Name/Purpose Field**

**Purpose:** Track and identify why each CSR code was created

**Backend Changes:**
- Added `codeName` field to CSRCode model (String, required)
- Updated `generateCode` to require and store code name
- Code name included in all API responses

**Frontend Changes:**
- Added "Code Name / Purpose" input field (first field in form)
- Placeholder: "e.g., Partner Program 2024, Student Trial, NGO Collaboration"
- Helper text: "Describe the purpose of this CSR code"
- Displayed prominently below code value in green italic text

**Display:**
```
CSR-XXXX-XXXX
Partner Program 2024  ← Code name in green
├─ Created By: Admin Name
├─ Expires: Date
├─ Usage: 5/50
├─ Access Duration: 12 months
└─ Status: Valid
```

---

### 2. **Negative Renewal Options**

**Purpose:** Allow super admin to reduce/shorten CSR user access when needed

**Use Cases:**
- User violated terms → Reduce access by 1-2 months as warning
- Downgrade user from premium to standard access
- Gradual phase-out of access
- Penalty for misconduct (less severe than expulsion)

**Backend Changes:**
- Updated `renewCsrAccess` to accept negative months (-2, -1)
- Validation: Prevents expiration dates in the past
- If calculated date < current date → Sets expiration to now (immediate expiry)
- Dynamic message: "extended" for positive, "reduced" for negative

**Frontend Changes:**
- Added "-2 Months" and "-1 Month" options to dropdown
- Color coding: Red for negative, Green for positive
- Dropdown order: Negative first, then positive

**Dropdown Options:**
```
Renew Access ▼
├─ -2 Months (RED - Reduction)
├─ -1 Month (RED - Reduction)
├─ +3 Months (GREEN - Extension)
├─ +6 Months (GREEN - Extension)
└─ +12 Months (GREEN - Extension)
```

---

## API Changes

### Generate CSR Code
```javascript
POST /api/csr/generate
Body: {
  codeName: "Partner Program 2024",  // NEW - Required
  expiresAt: "2024-12-31T23:59:59",
  maxUses: 50,
  accessDurationMonths: 12
}
```

### Renew CSR Access
```javascript
PUT /api/csr/users/:userId/renew
Body: {
  months: -2  // NEW - Can be negative
}

Response: {
  message: "CSR access reduced by 2 month(s)",  // Dynamic message
  user: { ... }
}
```

---

## User Flow Examples

### Scenario 1: Generate Code with Name
1. Super admin clicks "Generate Code"
2. Fills in:
   - Code Name: "Student Trial Program"
   - Expiration: 6 months from now
   - Max Uses: 100
   - Access Duration: 3 months
3. Code generated: CSR-XXXX-XXXX
4. Displayed with name: "Student Trial Program"

### Scenario 2: Reduce User Access
1. CSR user violates community guidelines
2. Super admin views user in CSR Management
3. Selects "-1 Month" from dropdown
4. User's expiration reduced by 1 month
5. Success message: "CSR access reduced by 1 month(s)"

### Scenario 3: Immediate Expiry via Reduction
1. User has 15 days of access remaining
2. Super admin selects "-2 Months"
3. Calculated date would be in the past
4. System sets expiration to current time
5. User access expires immediately

---

## Validation & Edge Cases

### Code Name Validation:
- ✅ Required field (cannot be empty)
- ✅ Any string accepted (no length limit)
- ✅ Stored exactly as entered (preserves case)

### Negative Renewal Validation:
- ✅ Accepts -2, -1, 0 (rejected), +3, +6, +12
- ✅ Prevents expiration in the past (sets to now)
- ✅ Works with already expired users (extends from now)
- ✅ Dynamic success message based on positive/negative

### Display Logic:
- Code name always visible on code cards
- Negative options shown in red
- Positive options shown in green
- Dropdown resets after selection

---

## Database Schema

### CSRCode Model
```javascript
{
  code: String (unique, uppercase),
  codeName: String (required),  // NEW
  createdBy: ObjectId,
  expiresAt: Date,
  maxUses: Number,
  accessDurationMonths: Number,
  currentUses: Number,
  isActive: Boolean,
  usedBy: Array
}
```

---

## UI/UX Improvements

### Generation Form Layout:
```
Generate New CSR Code
┌─────────────────────────────────────┐
│ Code Name / Purpose *               │
│ [e.g., Partner Program 2024...]     │
│ Describe the purpose of this code   │
├─────────────────┬───────────────────┤
│ Expiration Date │ Maximum Uses      │
├─────────────────┴───────────────────┤
│ Access Duration (Months)            │
│ How long users get free access      │
└─────────────────────────────────────┘
```

### Code Display:
```
┌─────────────────────────────────────┐
│ CSR-A1B2-C3D4                       │
│ Partner Program 2024 (green italic) │
├─────────────────────────────────────┤
│ Created By: Admin Name              │
│ Expires: Dec 31, 2024               │
│ Usage: 25 / 50                      │
│ Access Duration: 12 months          │
│ Status: Valid                       │
└─────────────────────────────────────┘
```

### Renewal Dropdown:
```
┌─────────────────────┐
│ Renew Access ▼      │
├─────────────────────┤
│ -2 Months (🔴)      │
│ -1 Month (🔴)       │
│ +3 Months (🟢)      │
│ +6 Months (🟢)      │
│ +12 Months (🟢)     │
└─────────────────────┘
```

---

## Benefits

### Code Name Feature:
✅ **Organization** - Easy to identify code purposes at a glance
✅ **Tracking** - Know which codes are for partners, students, NGOs, etc.
✅ **Reporting** - Better analytics and reporting capabilities
✅ **Clarity** - No confusion about why a code was created

### Negative Renewal Feature:
✅ **Flexibility** - More control over user access management
✅ **Gradual Penalties** - Warning system before full expulsion
✅ **Downgrade Path** - Reduce access without deleting users
✅ **Immediate Action** - Can expire access instantly if needed

---

## Testing Checklist

### Code Name:
- [ ] Cannot generate code without code name
- [ ] Code name displays on code cards
- [ ] Code name stored in database
- [ ] Code name visible in all code lists
- [ ] Special characters in code name handled correctly

### Negative Renewal:
- [ ] -2 months reduces access correctly
- [ ] -1 month reduces access correctly
- [ ] Reduction that goes past current date sets to now
- [ ] Success message shows "reduced" for negative
- [ ] Success message shows "extended" for positive
- [ ] Dropdown shows red for negative options
- [ ] Dropdown shows green for positive options

### Integration:
- [ ] Code generation form validates all fields
- [ ] Renewal updates user expiration correctly
- [ ] Analytics reflect updated expiration dates
- [ ] Color indicators update after renewal

---

## Files Modified

### Backend:
- `backend/models/CSRCode.js` - Added codeName field
- `backend/controllers/csrController.js` - Updated generateCode and renewCsrAccess

### Frontend:
- `frontend/src/components/CSRManagement.js` - Added code name field and negative options
- `frontend/src/components/CSRManagement.css` - Added styling for code name and dropdown colors

---

## Summary

✅ **Code Name** - Track purpose of each CSR code  
✅ **Negative Renewal** - Reduce user access by 1-2 months  
✅ **Color Coding** - Red for reduction, green for extension  
✅ **Validation** - Prevents past dates, handles edge cases  
✅ **Dynamic Messages** - "extended" vs "reduced" feedback  
✅ **Better Organization** - Easier to manage multiple codes  

This gives super admin complete control over CSR code identification and user access management! 🎓✨
