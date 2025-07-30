# 📅 Calendar Filter Fix - Testing Guide

## What Was Fixed

### 1. **Gmail API Date Query Format**
- Fixed Gmail API to use `YYYY/MM/DD` format instead of ISO strings
- Fixed date range queries to use proper before/after logic

### 2. **Email Date Parsing**
- Fixed Gmail `internalDate` parsing to handle timestamp format correctly
- Added fallback parsing for different date formats

### 3. **Database Date Filtering**
- Modified queries to include items with `NULL` sourceDate
- Items without dates now show up in filtered results

### 4. **Frontend Date Handling**
- Improved UTC conversion to be more consistent
- Fixed cache key strategy to prevent memory leaks
- Added "Show All" button to clear date filters

### 5. **WebSocket Cache Invalidation**
- Fixed cache invalidation to update all date-filtered queries
- Improved real-time updates

## How to Test

### Step 1: Start the Server
```bash
npm run dev
```

### Step 2: Test Server Health (Optional)
```bash
node test-calendar.js
```

### Step 3: Test in Browser
1. Go to `http://localhost:5000`
2. Register/login to get authenticated
3. Connect Gmail account (if you have credentials set up)
4. Try the calendar filter buttons:
   - **Today** - Should show today's items + items without dates
   - **Yesterday** - Should show yesterday's items + items without dates  
   - **Show All** - Should show all items regardless of date
   - **Calendar picker** - Should show items for selected date + items without dates

### Step 4: Debug Endpoints (When Logged In)
Access these URLs in browser after authentication:
- `/api/debug/today` - Shows today's date filtering logic
- `/api/debug/calendar?date=2025-07-29` - Shows specific date filtering

## Expected Behavior

### ✅ Working Calendar Filter Should:
1. **Show items when date is selected** - Even if no emails exactly match that date
2. **Include items without sourceDate** - Items with NULL dates should always appear
3. **Real-time updates** - New items should appear immediately via WebSocket
4. **Consistent cache** - No duplicate API calls for same date
5. **Clear feedback** - "Show All" button provides escape from empty results

### ❌ Previous Issues (Now Fixed):
1. ~~Empty results when selecting any date~~
2. ~~Items with NULL sourceDate filtered out completely~~
3. ~~Gmail API using wrong date format~~
4. ~~Cache invalidation not working~~
5. ~~No way to clear date filter~~

## Common Issues & Solutions

### "No items showing for today"
- Check if you have work items in database
- Try "Show All" button to see total items
- Check browser console for API errors
- Verify Gmail token is valid

### "Calendar picker not working"
- Ensure JavaScript console shows date selection logs
- Check network tab for API calls
- Verify date format in URL parameters

### "Real-time updates not working"
- Check WebSocket connection in browser console
- Look for `🔌 WebSocket connected: true` logs
- Refresh page if WebSocket disconnected

## Debug Information

### Frontend Console Logs to Look For:
- `📅 Today button clicked`
- `📅 Safe date change:`
- `📊 Fetching work items with URL:`
- `🔌 WebSocket connected: true`

### Backend Console Logs to Look For:
- `📅 Gmail API date filtering:`
- `📧 Processing X valid emails`
- `📊 Database query completed`
- `✅ Work item created`

## Architecture Summary

```
User clicks "Today" → DateFilter converts to UTC → API request with date params → 
Backend parses dates → Database query (includes NULL dates) → Returns items → 
Frontend displays + WebSocket keeps real-time
```

The key fix is that **every layer now handles dates consistently** and **NULL dates are included in results**.
