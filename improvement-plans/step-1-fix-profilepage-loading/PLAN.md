# Fix ProfilePage Loading State Issue

**Status:** ✅ **COMPLETED**  
**Completed Date:** January 26, 2026  
**Test Results:** See `TEST_RESULTS.md`

## Problem Analysis

The ProfilePage shows "Loading..." indefinitely due to several potential issues:

1. **Route Protection Race Condition**: The route's `beforeLoad` checks `context.auth.isAuthenticated` before auth finishes loading, potentially causing redirect loops
2. **No Timeout Handling**: If `authApi.getCurrentUser()` hangs or takes too long, `isLoading` stays true indefinitely
3. **No Error Recovery**: Failed auth checks don't provide retry mechanisms
4. **Double Loading Check**: Both AuthProvider (lines 127-136) and ProfilePage (line 34) check loading state, creating potential conflicts

## Root Cause

- `src/routes/profile.tsx` `beforeLoad` checks `isAuthenticated` which may be false while `isLoading` is true
- `src/auth.tsx` `refresh()` function may fail silently or hang
- `src/components/ProfilePage.tsx` checks `auth.isLoading || !user` but has no timeout or error handling
- No mechanism to detect and recover from stuck loading states

## Implementation Steps

### Step 1: Improve Auth Context Loading State Handling

**File**: `src/auth.tsx`

- Add timeout to `refresh()` function (10 seconds max)
- Add error state tracking separate from loading state
- Ensure `isLoading` always resolves to false, even on errors
- Add retry counter to prevent infinite retries
- Log errors for debugging

**Changes**:
- Add `error` state to track auth errors
- Wrap `authApi.getCurrentUser()` in timeout promise
- Add `maxRetries` constant (3 attempts)
- Improve error handling in catch block
- Export error state in AuthState interface

### Step 2: Fix Route Protection to Wait for Auth Loading

**File**: `src/routes/profile.tsx`

- Check `isLoading` before checking `isAuthenticated`
- Wait for auth to finish loading before making redirect decision
- Only redirect if loading is complete AND user is not authenticated

**Changes**:
- Update `beforeLoad` to check `context.auth.isLoading` first
- If loading, don't redirect (let component handle it)
- Only redirect if `!isLoading && !isAuthenticated`

### Step 3: Add Timeout and Error Handling to ProfilePage

**File**: `src/components/ProfilePage.tsx`

- Add timeout mechanism (10 seconds) for loading state
- Add error state to track loading failures
- Create error display component with retry button
- Add loading state debugging logs
- Improve loading check logic

**Changes**:
- Add `useState` for `loadingError` and `loadingTimeout`
- Add `useEffect` to set timeout when loading starts
- Create `ErrorDisplay` component for error state
- Add `handleRetry` function to retry auth refresh
- Update loading check to handle timeout and errors

### Step 4: Add Error Boundary Component

**File**: `src/components/ErrorBoundary.tsx` (new file)

- Create React error boundary component
- Catch component errors and display user-friendly message
- Provide retry mechanism
- Log errors for debugging

**Changes**:
- Create class component extending `React.Component`
- Implement `componentDidCatch` for error handling
- Display error UI with retry option
- Reset error state on retry

### Step 5: Wrap ProfilePage with Error Boundary

**File**: `src/routes/profile.tsx` or `src/components/ProfilePage.tsx`

- Wrap ProfilePage component with ErrorBoundary
- Ensure errors are caught and displayed properly

### Step 6: Add Debugging and Logging

**Files**: `src/auth.tsx`, `src/components/ProfilePage.tsx`

- Add console logs for loading state transitions
- Log when `isLoading` changes
- Log when `user` is set/cleared
- Log timeout events
- Log error occurrences

**Note**: Remove or gate behind dev flag in production

## Files to Modify

1. `src/auth.tsx` - Improve refresh() function with timeout and error handling
2. `src/routes/profile.tsx` - Fix route protection logic
3. `src/components/ProfilePage.tsx` - Add timeout, error handling, and retry mechanism
4. `src/components/ErrorBoundary.tsx` - Create new error boundary component

## Code Structure

```
src/
├── auth.tsx (modify)
├── routes/
│   └── profile.tsx (modify)
└── components/
    ├── ProfilePage.tsx (modify)
    └── ErrorBoundary.tsx (new)
```

## Testing Requirements

1. **Valid Authentication**: ProfilePage loads within 3 seconds
2. **Expired Session**: Shows appropriate error with retry option
3. **Network Failure**: Shows network error with retry option
4. **Slow Network**: Timeout triggers after 10 seconds, shows error
5. **API Error**: Shows error message, allows retry
6. **Component Error**: Error boundary catches and displays error
7. **Loading State**: Verify loading clears properly in all scenarios

## Success Criteria

- ProfilePage loads within 3 seconds for authenticated users
- Error messages display clearly if loading fails
- Retry mechanism works correctly
- No infinite loading states
- Timeout mechanism prevents indefinite loading
- Route protection doesn't interfere with loading state
- All error scenarios handled gracefully

## Implementation Notes

- Timeout duration: 10 seconds (configurable)
- Max retries: 3 attempts
- Error messages should be user-friendly
- Retry should reset loading state properly
- Debug logs should be removable for production
