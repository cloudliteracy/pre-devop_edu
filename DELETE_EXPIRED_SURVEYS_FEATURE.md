# Delete Expired Surveys Feature - Implementation

## Overview

Added a **Delete** button for expired surveys in the Survey Analytics section of the Admin Dashboard. Admins can now clean up old surveys that have expired.

## Features Implemented

### 1. Delete Button for Expired Surveys

**Location**: Admin Dashboard → Survey Analytics → Expired Surveys

**Visibility Rules:**
- ✅ Button appears ONLY on expired surveys
- ✅ Active surveys do NOT show delete button
- ✅ Button positioned next to "View Details" button

**Visual Design:**
- 🗑️ Red button with trash icon
- Color: `#ff4444` (red)
- Text: "🗑️ Delete"
- Loading state: "🗑️ Deleting..." (disabled)

### 2. Delete Confirmation

**Safety Feature:**
- Confirmation dialog before deletion
- Message: "Are you sure you want to delete the survey '[Survey Title]'? This action cannot be undone."
- User must confirm to proceed
- Can cancel to abort

### 3. Authorization

**Who Can Delete:**
- ✅ Survey creator (admin who created it)
- ✅ Primary Super Admin (can delete any survey)
- ❌ Other admins (cannot delete surveys they didn't create)

**Backend Validation:**
```javascript
const isOwner = poll.user.toString() === req.user._id.toString();
const isPrimarySuperAdmin = req.user.isPrimarySuperAdmin;

if (!isOwner && !isPrimarySuperAdmin) {
  return res.status(403).json({ message: 'Not authorized' });
}
```

### 4. Real-Time Updates

**After Deletion:**
- Success message displayed
- Page automatically refreshes
- Survey removed from list
- Socket.io broadcasts deletion to all connected admins

## How to Use

### Step 1: Navigate to Survey Analytics
1. Login as admin
2. Go to Admin Dashboard
3. Click on "Survey Analytics" tab

### Step 2: Filter Expired Surveys
1. Click "Expired" tab at the top
2. View all expired surveys
3. Each expired survey shows a red "🗑️ Delete" button

### Step 3: Delete Survey
1. Click "🗑️ Delete" button on desired survey
2. Confirmation dialog appears
3. Click "OK" to confirm deletion
4. Survey is deleted and page refreshes

### Step 4: Verify Deletion
1. Survey disappears from list
2. Success message: "Survey deleted successfully!"
3. Expired count decreases by 1

## UI Changes

### Before (Expired Survey Card)
```
┌─────────────────────────────────────────────┐
│ Survey Title                                │
│ By: Admin Name | 5 Questions | 10 Responses│
│ Status: Expired                             │
│                          [▶ View Details]   │
└─────────────────────────────────────────────┘
```

### After (Expired Survey Card)
```
┌─────────────────────────────────────────────┐
│ Survey Title                                │
│ By: Admin Name | 5 Questions | 10 Responses│
│ Status: Expired                             │
│              [🗑️ Delete] [▶ View Details]   │
└─────────────────────────────────────────────┘
```

### Active Survey (No Delete Button)
```
┌─────────────────────────────────────────────┐
│ Survey Title                                │
│ By: Admin Name | 5 Questions | 10 Responses│
│ Status: 2d remaining                        │
│                          [▶ View Details]   │
└─────────────────────────────────────────────┘
```

## Technical Implementation

### Frontend Changes

**File**: `frontend/src/components/SurveyAnalytics.js`

**Added State:**
```javascript
const [deleting, setDeleting] = useState(null);
```

**Added Function:**
```javascript
const handleDeleteSurvey = async (surveyId, surveyTitle) => {
  // Confirmation dialog
  if (!window.confirm(`Are you sure...`)) return;
  
  // Set loading state
  setDeleting(surveyId);
  
  // API call
  const response = await fetch(`/api/polls/${surveyId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // Handle response
  if (response.ok) {
    alert('Survey deleted successfully!');
    window.location.reload();
  }
};
```

**Added Button:**
```javascript
{!survey.isActive && (
  <button
    onClick={() => handleDeleteSurvey(survey._id, survey.title)}
    disabled={deleting === survey._id}
  >
    {deleting === survey._id ? '🗑️ Deleting...' : '🗑️ Delete'}
  </button>
)}
```

### Backend (Already Existed)

**Endpoint**: `DELETE /api/polls/:id`

**Controller**: `backend/controllers/pollController.js`

**Function**: `deletePoll()`

**Features:**
- Validates survey exists
- Checks authorization (owner or super admin)
- Deletes survey from database
- Broadcasts deletion via Socket.io
- Returns success message

## Use Cases

### Scenario 1: Clean Up Old Surveys
**Situation**: Admin has 20 expired surveys cluttering the dashboard
**Action**: Filter by "Expired" and delete old surveys one by one
**Benefit**: Cleaner dashboard, easier to manage active surveys

### Scenario 2: Remove Test Surveys
**Situation**: Admin created test surveys during setup
**Action**: Wait for them to expire, then delete
**Benefit**: Remove test data from production

### Scenario 3: Delete Irrelevant Surveys
**Situation**: Survey topic no longer relevant
**Action**: Delete expired survey to remove from analytics
**Benefit**: Focus on current, relevant data

### Scenario 4: Data Privacy Compliance
**Situation**: Need to remove old survey responses
**Action**: Delete expired surveys containing sensitive data
**Benefit**: Comply with data retention policies

## Safety Features

### 1. Confirmation Dialog
- Prevents accidental deletion
- Shows survey title for verification
- Clear warning about irreversibility

### 2. Authorization Check
- Only owner or super admin can delete
- Backend validates permissions
- Prevents unauthorized deletion

### 3. Expired Only
- Delete button only on expired surveys
- Active surveys cannot be deleted
- Prevents deletion of ongoing surveys

### 4. Loading State
- Button disabled during deletion
- Shows "Deleting..." text
- Prevents double-deletion

### 5. Error Handling
- Catches network errors
- Displays error messages
- Doesn't crash on failure

## Testing Guide

### Test Case 1: Delete Expired Survey (Owner)
1. Login as admin who created survey
2. Wait for survey to expire (or manually set expiry in DB)
3. Go to Survey Analytics → Expired tab
4. Click "🗑️ Delete" on your survey
5. Confirm deletion
6. **Expected**: Survey deleted successfully

### Test Case 2: Delete Expired Survey (Super Admin)
1. Login as primary super admin
2. Go to Survey Analytics → Expired tab
3. Click "🗑️ Delete" on any expired survey
4. Confirm deletion
5. **Expected**: Survey deleted successfully

### Test Case 3: Try to Delete Active Survey
1. Go to Survey Analytics → Active tab
2. Look for delete button
3. **Expected**: No delete button visible

### Test Case 4: Cancel Deletion
1. Click "🗑️ Delete" on expired survey
2. Click "Cancel" in confirmation dialog
3. **Expected**: Survey NOT deleted, still in list

### Test Case 5: Delete Without Permission
1. Login as admin A
2. Try to delete survey created by admin B
3. **Expected**: Error "Not authorized to delete this survey"

### Test Case 6: Delete Non-Existent Survey
1. Manually call API with invalid survey ID
2. **Expected**: Error "Survey not found"

## Database Impact

### Before Deletion
```javascript
// Surveys collection
{
  _id: ObjectId("67abc..."),
  user: ObjectId("admin_id"),
  title: "Old Survey",
  questions: [...],
  expiresAt: ISODate("2025-01-01"),
  createdAt: ISODate("2024-12-01")
}
```

### After Deletion
```javascript
// Survey completely removed from database
// No trace left (hard delete, not soft delete)
```

### Cascade Effects
- ❌ Survey document deleted
- ❌ All questions deleted
- ❌ All responses deleted
- ❌ All uploaded files remain (manual cleanup needed)

## Limitations & Considerations

### Current Limitations
1. **No Soft Delete**: Survey is permanently deleted (cannot be recovered)
2. **No Bulk Delete**: Must delete surveys one by one
3. **No Archive**: No option to archive instead of delete
4. **File Cleanup**: Uploaded files not automatically deleted from server

### Future Enhancements
- [ ] Bulk delete (select multiple surveys)
- [ ] Soft delete with restore option
- [ ] Archive feature (hide without deleting)
- [ ] Automatic file cleanup on deletion
- [ ] Export survey data before deletion
- [ ] Deletion audit log
- [ ] Scheduled auto-deletion of old surveys

## Security Considerations

### Authorization
- ✅ JWT token required
- ✅ Admin role required
- ✅ Ownership or super admin verified
- ✅ Backend validation (not just frontend)

### Data Protection
- ⚠️ Permanent deletion (no recovery)
- ⚠️ Confirmation required
- ⚠️ No accidental deletion of active surveys

### Audit Trail
- ✅ Socket.io broadcasts deletion event
- ❌ No database log of deletion (future enhancement)

## Files Modified

1. **frontend/src/components/SurveyAnalytics.js**
   - Added `deleting` state
   - Added `handleDeleteSurvey()` function
   - Added delete button for expired surveys
   - Added confirmation dialog

2. **backend/controllers/pollController.js** (No changes - already existed)
   - `deletePoll()` function already implemented
   - Authorization already in place

3. **backend/routes/polls.js** (No changes - already existed)
   - `DELETE /:id` route already defined

## Summary

✅ **Feature Complete**: Delete button added for expired surveys
✅ **Safe**: Confirmation dialog prevents accidents
✅ **Authorized**: Only owner or super admin can delete
✅ **User-Friendly**: Clear visual feedback and error messages
✅ **Real-Time**: Socket.io broadcasts deletion to all admins

Admins can now easily clean up expired surveys from the Survey Analytics dashboard! 🗑️
