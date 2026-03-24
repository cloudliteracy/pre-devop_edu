# CSR Custom Duration - Quick Reference

## What Changed?

Previously: All CSR users got **fixed 1 year** of free access.

Now: Super admin **sets custom duration** when generating each CSR code (1-60 months).

---

## How to Generate CSR Code with Custom Duration

### Step 1: Open Admin Dashboard
- Login as super admin (admin@cloudliteracy.com)
- Navigate to "CSR Management" tab

### Step 2: Click "Generate Code"
Fill in 3 fields:
1. **Expiration Date**: When code expires (can't be used for new registrations)
2. **Maximum Uses**: How many users can register (e.g., 50)
3. **Access Duration**: How many months of free access (1-60)

### Step 3: Examples

**Trial Code (3 months):**
- Expiration Date: 3 months from now
- Maximum Uses: 100
- Access Duration: **3 months**
- Use case: Short-term trial users

**Partner Code (24 months):**
- Expiration Date: 1 year from now
- Maximum Uses: 20
- Access Duration: **24 months**
- Use case: Long-term partners

**Standard Code (12 months):**
- Expiration Date: 6 months from now
- Maximum Uses: 50
- Access Duration: **12 months** (default)
- Use case: Regular CSR users

---

## What Users See

When registering with CSR code:
```
✅ CSR registration successful! 
You now have free access to all modules for 6 months.
```

The duration message changes based on the code's setting.

---

## Code Display

Each CSR code now shows:
- Code: CSR-XXXX-XXXX
- Created By: Admin Name
- Expires: Date
- Usage: 5 / 50
- **Access Duration: 12 months** ← NEW
- Status: Valid/Expired

---

## Duration Limits

- **Minimum**: 1 month
- **Maximum**: 60 months (5 years)
- **Default**: 12 months
- **Recommended**: 
  - Trial: 3-6 months
  - Standard: 12 months
  - Partner: 24-36 months

---

## Important Notes

1. **Code Expiration ≠ User Access Expiration**
   - Code expiration: When code can't be used for NEW registrations
   - User access expiration: When existing user loses free access
   - These are independent!

2. **Different Codes, Different Durations**
   - You can have multiple active codes with different durations
   - Code A: 3 months, Code B: 12 months, Code C: 24 months
   - All can be active simultaneously

3. **Existing Users**
   - Existing CSR users keep their current expiration dates
   - New duration only applies to NEW registrations

4. **Renewal Still Works**
   - Super admin can still renew any user's access (+3/6/12 months)
   - Renewal is independent of original code duration

---

## Migration Notes

**For existing CSR codes (created before this update):**
- Will have `accessDurationMonths: 12` (default)
- Existing users keep their current expiration dates
- No action needed

**For new CSR codes:**
- Must specify duration when generating
- Field is required (no generation without it)

---

## Testing Scenarios

### Test 1: Short Duration Code
1. Generate code with 1 month duration
2. Register new user with code
3. Check user's expiration date (should be ~30 days from now)
4. Verify success message says "1 month"

### Test 2: Long Duration Code
1. Generate code with 36 months duration
2. Register new user with code
3. Check user's expiration date (should be ~3 years from now)
4. Verify success message says "36 months"

### Test 3: Multiple Codes
1. Generate Code A: 3 months
2. Generate Code B: 12 months
3. Register User 1 with Code A → expires in 3 months
4. Register User 2 with Code B → expires in 12 months
5. Verify both users have different expiration dates

---

## FAQ

**Q: Can I change duration after generating code?**
A: No, duration is set at code creation and cannot be changed. Generate a new code if needed.

**Q: What happens if I don't specify duration?**
A: Default is 12 months. But the field is required, so you must enter a value.

**Q: Can I set duration to 0 months?**
A: No, minimum is 1 month.

**Q: Can I set duration to 100 months?**
A: No, maximum is 60 months (5 years).

**Q: Does renewal use the original code's duration?**
A: No, renewal is manual (+3/6/12 months) regardless of original duration.

**Q: Can regular admins set duration?**
A: No, only super admin can generate CSR codes.

---

## Summary

✅ **Flexible**: Set any duration from 1-60 months  
✅ **Per-Code**: Each code can have different duration  
✅ **Clear**: Users see duration in registration message  
✅ **Visible**: Duration displayed on code cards  
✅ **Simple**: Just one extra field in generation form  

This gives you complete control over CSR access periods! 🎓
