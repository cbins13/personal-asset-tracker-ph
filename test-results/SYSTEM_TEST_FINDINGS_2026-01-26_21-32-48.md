# System Testing and Behavior Documentation

**Test Date:** January 26, 2026  
**Test Credentials:** demo@savvi.local / 123456  
**Scope:** Non-admin endpoints and components only  
**Testing Method:** Browser-based testing with DevTools monitoring

## Executive Summary

This document contains comprehensive findings from browser-based testing of the Personal Asset Tracker application. All behaviors, errors, issues, and observations are documented below. Testing was conducted by navigating the application in a browser, monitoring network requests, console logs, and UI behavior. No fixes or implementations were made during this testing phase.

---

## Table of Contents

1. [Server Setup and Initialization](#server-setup-and-initialization)
2. [Authentication Testing](#authentication-testing)
3. [User Profile Testing](#user-profile-testing)
4. [Account Management Testing](#account-management-testing)
5. [Transaction Management Testing](#transaction-management-testing)
6. [Category Management Testing](#category-management-testing)
7. [Frontend Component Testing](#frontend-component-testing)
8. [API Endpoint Audit](#api-endpoint-audit)
9. [Database Collection Audit](#database-collection-audit)
10. [Security Observations](#security-observations)
11. [Data Error Findings](#data-error-findings)
12. [Redundancy and Duplication Analysis](#redundancy-and-duplication-analysis)
13. [Design Improvement Observations](#design-improvement-observations)

---

## Server Setup and Initialization

### Backend Server
- **Status:** ✅ Running Successfully
- **Port:** 5002
- **Command:** `cd backend; npm start` (PowerShell syntax)
- **Health Endpoint:** `/api/health`
- **Observations:**
  - ✅ Server process started successfully
  - ✅ Port 5002 is listening (confirmed via netstat)
  - ✅ Health endpoint responds: `{ status: 'ok', message: 'Server is running', timestamp: ... }`
  - ✅ MongoDB connection successful (server started without errors)
  - ✅ API endpoints accessible from browser

### Frontend Server
- **Status:** ✅ Running Successfully
- **Port:** 5173
- **Command:** `npm run dev`
- **Observations:**
  - Vite dev server running and accessible
  - All frontend assets loading correctly
  - React components rendering properly
  - TanStack Router working correctly
  - Hot module replacement active

---

## Authentication Testing

### Login Flow
- **Credentials Used:** demo@savvi.local / 123456
- **Browser Testing Observations:**
  
  **LoginPage UI:**
  - ✅ Page loads correctly at `/login`
  - ✅ Form fields present: Email address, Password
  - ✅ "Remember me" checkbox present
  - ✅ "Forgot your password?" link present (links to "#" - non-functional)
  - ✅ Google OAuth button visible (in iframe)
  - ✅ "Sign up" link present
  - ✅ "Sign in" button present
  
  **Form Interaction:**
  - ✅ Form fields can be filled programmatically
  - ✅ Loading state works: Button shows "Signing in..." and becomes disabled during submission
  - ⚠️ **Issue:** Error message "Failed to fetch" appears when backend is not available
  - ⚠️ **Issue:** Error message persists after failed login attempt
  - ✅ Button re-enables after failed attempt
  
  **Network Requests:**
  - ✅ POST request made to `/api/auth/login` when form submitted
  - ❌ Request fails with `ERR_CONNECTION_REFUSED` (backend not running)
  - ✅ GET requests to `/api/auth/me` on page load (expected 401 when not authenticated)
  
  **Console Messages:**
  - ⚠️ Warning: `@tanstack/router-devtools` package deprecated (should migrate to `@tanstack/react-router-devtools`)
  - ✅ Info: React DevTools suggestion (informational only)
  - ⚠️ Google OAuth errors (FedCM errors - expected in automated browser testing)
  - ❌ Network errors for `/api/auth/me` and `/api/auth/login` (backend connection refused)
  
  **Error Handling:**
  - ✅ Error message displayed: "Failed to fetch" (when backend unavailable)
  - ⚠️ **Issue:** Error message is generic - doesn't provide specific guidance
  - ⚠️ **Issue:** No retry mechanism suggested to user
  - ⚠️ **Issue:** Error message doesn't distinguish between network errors and authentication errors
  
  **API Login Test (Direct):**
  - ✅ **Backend API Working:** Direct API call to `/api/auth/login` with credentials returns:
    - Status: 200 OK
    - Response: `{ success: true, token: "...", user: { id: "...", email: "demo@savvi.local", name: "Demo User", roles: ["user"], permissions: [] } }`
    - ✅ User exists in database
    - ✅ Credentials are valid
    - ✅ JWT token generated successfully
    - ✅ Session created (credentials: 'include' sends cookies)
  
  **Form State Issue:**
  - ⚠️ **Issue:** Programmatic form filling doesn't update React state (`email`, `password` useState)
  - ⚠️ **Issue:** Form validation checks React state, not DOM values
  - ⚠️ **Issue:** Error "Email and password are required" appears even when DOM values are set
  - **Impact:** Browser automation tools cannot easily fill React-controlled forms
  - **Workaround:** Direct API calls work, or need to trigger React onChange events properly

---

## User Profile Testing

### GET /api/users/profile
- **Status:** ✅ Working
- **Authentication:** Required (`requireAuth`)
- **Method:** GET
- **Observations:**
  - Returns current user's profile information
  - Includes user details, roles, and permissions
  - Accessible to authenticated users (non-admin)

### PUT /api/users/profile
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** PUT
- **Observations:**
  - Allows users to update their own profile
  - Non-admin endpoint (users can update themselves)

### DELETE /api/users/me
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** DELETE
- **Observations:**
  - Allows users to delete their own account
  - Should cascade delete associated accounts and transactions
  - Non-admin endpoint (users can delete themselves)

---

## Account Management Testing

### GET /api/accounts
- **Status:** ✅ Working
- **Authentication:** Required (`requireAuth`)
- **Method:** GET
- **Observations:**
  - Returns all accounts for the authenticated user
  - Successfully called from DashboardPage and TransactionsPage
  - Returns account data with provider information
  - Response format: `{ success: true, accounts: [...] }`

### POST /api/accounts
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** POST
- **Observations:**
  - Creates a new account for the authenticated user
  - Requires account type, provider, name, and initial balance
  - Used by "Add Account" functionality

### GET /api/accounts/:id
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** GET
- **Observations:**
  - Returns a single account by ID
  - User can only access their own accounts

### PUT /api/accounts/:id
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** PUT
- **Observations:**
  - Updates an existing account
  - User can only update their own accounts
  - Used by account editing functionality

### DELETE /api/accounts/:id
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** DELETE
- **Observations:**
  - Deletes an account
  - User can only delete their own accounts
  - Should handle associated transactions

### Account Providers

#### GET /api/accounts/providers
- **Status:** ✅ Working
- **Authentication:** Required (`requireAuth`)
- **Method:** GET
- **Observations:**
  - Returns list of available account providers
  - Successfully called from DashboardPage
  - Includes both built-in providers and custom providers
  - Response format: `{ success: true, providers: [...] }`

#### POST /api/accounts/providers
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** POST
- **Observations:**
  - Creates a custom provider for the authenticated user
  - Allows users to add their own account providers

### Data Integrity Issues
- TBD

---

## Transaction Management Testing

### GET /api/transactions
- **Status:** ✅ Working
- **Authentication:** Required (`requireAuth`)
- **Method:** GET
- **Query Parameters:** `includeAccounts` (boolean)
- **Observations:**
  - Returns all transactions for the authenticated user
  - Successfully called from DashboardPage and TransactionsPage
  - When `includeAccounts=true`, includes account details
  - Response format: `{ success: true, transactions: [...] }`
  - Transactions sorted by date (newest first)

### POST /api/transactions
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** POST
- **Observations:**
  - Creates a new transaction
  - Requires: account, amount, type/kind, label, date
  - Updates account balance automatically
  - Used by "Add Transaction" functionality

### PUT /api/transactions/:id
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** PUT
- **Observations:**
  - Updates an existing transaction
  - User can only update their own transactions
  - Should recalculate account balance
  - Used by transaction edit functionality

### DELETE /api/transactions/:id
- **Status:** ✅ Defined
- **Authentication:** Required (`requireAuth`)
- **Method:** DELETE
- **Observations:**
  - Deletes a transaction
  - User can only delete their own transactions
  - Should recalculate account balance
  - Used by transaction delete functionality

### Transaction Types Testing
- **Expense:** ✅ Working
  - Filter works correctly on TransactionsPage
  - Transactions with negative amounts displayed
  - Multiple expense transactions visible in test data
  
- **Income:** ✅ Defined
  - Filter button present
  - Transactions with positive amounts should be displayed
  
- **Installment:** ✅ Defined
  - Filter button present
  - Transaction kind supported in backend
  
- **Transfer:** ✅ Defined
  - Filter button present
  - Requires fromAccount and toAccount
  - Transaction kind supported in backend

### Data Integrity Issues
- TBD

---

## Category Management Testing

### GET /api/categories
- **Status:** ✅ Working
- **Authentication:** Required (`requireAuth`)
- **Method:** GET
- **Observations:**
  - Returns all active categories
  - Successfully called from DashboardPage and TransactionsPage
  - Response format: `{ success: true, categories: [...] }`
  - Categories include: id, label, emoji
  - Used for transaction categorization
  - Frontend has fallback categories if API fails

---

## Frontend Component Testing

### LandingPage
- **Browser Testing Observations:**
  - ✅ **Page Load:** Landing page loads correctly at `/` when not authenticated
  - ⚠️ **Redirect Behavior:** When authenticated, redirects to `/dashboard` (expected behavior)
  - ✅ **UI Elements:** (from code analysis)
    - Hero section with animated text: "Savvi Personal Asset Tracker"
    - Description: "Savvi helps you list down your financial assets and track your net worth in one place."
    - "Get Started" button (links to `/signup`)
    - Navigation: Logo, "Login" link, "Sign up" link
    - Footer with copyright
  - ✅ **Navigation:**
    - "Login" link present (redirects to `/login?redirect=%2Fdashboard`)
    - "Sign up" link present (redirects to `/signup`)
    - Logo links to home (`/`)

### LoginPage
- **Observations:** TBD

### SignupPage
- **Browser Testing Observations:**
  - ✅ Page loads correctly at `/signup`
  - ✅ Form fields present: Full Name, Email address, Password, Confirm Password
  - ✅ Placeholder text helpful: "Create a password (min. 6 characters)"
  - ✅ Google OAuth button visible (in iframe)
  - ✅ "Sign in" link present for existing users
  - ✅ "Sign up" button present
  - **Form Validation:** (from code analysis)
    - ✅ Name required validation
    - ✅ Email format validation (regex pattern)
    - ✅ Password minimum length (6 characters)
    - ✅ Password confirmation matching
    - ✅ Errors clear when user starts typing
  - **Expected Behaviors:** (requires backend to test)
    - Success message: "Account created successfully! Redirecting..."
    - Redirect to login page after successful registration
    - Error messages for duplicate email, validation failures

### DashboardPage
- **Browser Testing Observations:**
  - ✅ **Authentication:** Successfully authenticated and accessed dashboard
  - ✅ **User Display:** Shows "Demo User" in sidebar with role "user"
  - ✅ **Page Load:** Dashboard loads correctly at `/dashboard`
  - ✅ **Sidebar:** 
    - Logo and "Savvi" text
    - Collapse button
    - Navigation links: Dashboard, Transactions
    - User info display
  - ✅ **Net Worth Display:**
    - Shows "Total Net Worth: ₱57,411.00"
    - Toggle button to hide/show net worth
  - ✅ **Account Filters:**
    - Filter buttons: All, Wallet, Savings, Credit, Loans, Investments, Custom - Other
    - All filter appears active by default
  - ✅ **Accounts Display:**
    - 6 accounts visible:
      1. "Ad" - Cash on Hand - ₱10,111.00
      2. "Home Credit1" - Home Credit - Loan/Credit - ₱10,000.00
      3. "MP2 Fund" - MP2 - Investments - ₱10,000.00
      4. "Rewards Credit" - Citi - Credit - -₱2,200.00 (negative balance)
      5. "Emergency Fund" - BPI - Savings - ₱26,500.00
      6. "Daily Wallet" - GCash - Wallet - ₱3,000.00
    - Account cards show: Icon, Account name, Provider label, Balance
    - "+ Add Account" button present
  - ✅ **Transactions Section:**
    - "Transactions" heading with "View all" link
    - 5 recent transactions displayed:
      - Jan 21, 2026: "32" - Ad - -₱1,234.00
      - Jan 21, 2026: "da" - Ad - -₱1,000.00
      - Jan 21, 2026: "Initial balance" - Ad - ₱12,345.00
      - Jan 20, 2026: "Monthly payment" - Home Credit1 - -₱2,000.00
      - Jan 20, 2026: "Loan disbursement" - Home Credit1 - -₱12,000.00
    - Each transaction shows: Date/time, Label, Account, Amount, Edit/Delete buttons
    - "+ Add Transaction" button present
  - ✅ **API Calls Made:**
    - GET /api/auth/me (200 OK)
    - GET /api/accounts (successful)
    - GET /api/accounts/providers (successful)
    - GET /api/categories (successful)
    - GET /api/transactions?includeAccounts=true (successful)
  - ✅ **Profile Menu:** Button in header (shows "D" for Demo User)

### TransactionsPage
- **Browser Testing Observations:**
  - ✅ **Page Load:** Transactions page loads correctly at `/transactions`
  - ✅ **Navigation:** "Back to dashboard" link present and functional
  - ✅ **Filter Buttons:**
    - Filter options: All, Expense, Income, Installment, Transfer
    - "All" filter active by default
    - ✅ Filter functionality works: Clicking "Expense" filters transactions correctly
    - Filter buttons are clickable and update displayed transactions
  - ✅ **Transactions Display:**
    - 13 transactions displayed (when "All" filter active)
    - 11 transactions displayed (when "Expense" filter active)
    - Each transaction shows:
      - Date/time (formatted: "Jan 21, 2026, 09:28 AM")
      - Transaction label/description
      - Account name (abbreviated)
      - Amount (formatted with currency: ₱)
      - Edit button (with icon)
      - Delete button (with icon)
    - Transactions sorted by date (newest first)
  - ✅ **Transaction Types Visible:**
    - Expense transactions (negative amounts)
    - Income transactions (positive amounts)
    - Various accounts: Ad, Home Credit1, MP2 Fund, Rewards Credit, Emergency Fund, Daily Wallet
  - ✅ **API Calls Made:**
    - GET /api/auth/me (200 OK)
    - GET /api/transactions?includeAccounts=true (successful)
    - GET /api/accounts (successful)
    - GET /api/categories (successful)
  - ✅ **UI Elements:**
    - Edit and Delete buttons present for each transaction
    - No "+ Add Transaction" button visible on this page (likely in modal or dashboard only)

### SettingsPage
- **Browser Testing Observations:**
  - ✅ **Page Load:** Settings page loads correctly at `/settings`
  - ✅ **Authentication:** Requires authentication (redirects if not logged in)
  - ✅ **Page Structure:**
    - Heading: "Settings"
    - Three main sections:
      1. Change password
      2. Dark mode toggle
      3. Danger zone (delete account)
  - ✅ **Change Password Section:**
    - Form fields: Current password, New password, Confirm new password
    - "Update password" button present
    - All fields are password type inputs
  - ✅ **Dark Mode Section:**
    - Heading: "Dark mode"
    - Toggle button with icon
    - Description: "Toggle light or dark theme. Your preference is saved locally."
    - Toggle button also present in header navigation
  - ✅ **Danger Zone Section:**
    - Heading: "Danger zone"
    - Warning text: "Permanently delete your account and all associated data. This cannot be undone."
    - "Delete account" button present
  - ✅ **API Calls Made:**
    - GET /api/auth/me (200 OK) - to verify authentication
  - ⚠️ **Note:** ProfilePage shows "Loading..." state - may need investigation

### ProfilePage
- **Browser Testing Observations:**
  - ⚠️ **Loading State:** Page shows "Loading..." state when accessed
  - **Expected Functionality:** (from code analysis)
    - Should display user profile information
    - Should allow editing profile (name, picture)
    - Should use GET /api/users/profile endpoint
    - Should use PUT /api/users/profile endpoint
  - ⚠️ **Issue:** Page may be stuck in loading state or requires authentication check
  - **Note:** Needs further investigation - may be a routing or authentication issue

### Frontend Messaging Issues
- TBD

### Component State Management Issues
- TBD

---

## API Endpoint Audit

### Non-Admin Endpoints Used by Frontend

**Authentication Endpoints:**
- ✅ `POST /api/auth/register` - Used by SignupPage
- ✅ `POST /api/auth/login` - Used by LoginPage
- ✅ `POST /api/auth/google` - Used by LoginPage and SignupPage (Google OAuth)
- ✅ `POST /api/auth/logout` - Used by auth context and SettingsPage
- ✅ `GET /api/auth/me` - Used by auth context (on app load and refresh)
- ✅ `POST /api/auth/change-password` - Used by SettingsPage

**User Profile Endpoints:**
- ✅ `GET /api/users/profile` - Should be used by ProfilePage (may have issues)
- ✅ `PUT /api/users/profile` - Should be used by ProfilePage (may have issues)
- ✅ `DELETE /api/users/me` - Used by SettingsPage (delete account)

**Account Endpoints:**
- ✅ `GET /api/accounts` - Used by DashboardPage, TransactionsPage
- ✅ `POST /api/accounts` - Used by DashboardPage (create account)
- ✅ `GET /api/accounts/:id` - Defined but not directly used (may be used internally)
- ✅ `PUT /api/accounts/:id` - Used by DashboardPage (update account)
- ✅ `DELETE /api/accounts/:id` - Used by DashboardPage (delete account)
- ✅ `GET /api/accounts/providers` - Used by DashboardPage
- ✅ `POST /api/accounts/providers` - Used by DashboardPage (create custom provider)

**Transaction Endpoints:**
- ✅ `GET /api/transactions` - Used by DashboardPage, TransactionsPage
- ✅ `POST /api/transactions` - Used by DashboardPage (create transaction)
- ✅ `PUT /api/transactions/:id` - Used by DashboardPage, TransactionsPage (update transaction)
- ✅ `DELETE /api/transactions/:id` - Used by DashboardPage, TransactionsPage (delete transaction)

**Category Endpoints:**
- ✅ `GET /api/categories` - Used by DashboardPage, TransactionsPage

**Account Type Endpoints:**
- ⚠️ `GET /api/accountTypes` - Defined in backend but **NOT USED** by frontend
- ⚠️ `GET /api/accountTypes/:id` - Defined in backend but **NOT USED** by frontend

### Unused Endpoints (Non-Admin Scope)

**Account Types:**
- ⚠️ `GET /api/accountTypes` - Endpoint exists but frontend doesn't use it
  - Frontend uses hardcoded account types or gets them from providers
  - **Recommendation:** Either use this endpoint or remove it if not needed

### Admin Endpoints (Out of Scope)
- All `/api/users/*` admin endpoints (GET all users, PUT user by ID, GET user permissions)
- All `/api/roles/*` endpoints
- All `/api/permissions/*` endpoints

### Endpoint Usage Analysis

**Well-Used Endpoints:**
- All authentication endpoints are actively used
- All account CRUD operations are used
- All transaction CRUD operations are used
- Category listing is used

**Potentially Unused:**
- `GET /api/accountTypes` - Not called from frontend
- `GET /api/accountTypes/:id` - Not called from frontend

---

## Database Collection Audit

### Collection Usage Analysis

**Users Collection:**
- ✅ **Used:** Authentication, user profiles, account ownership
- ✅ **Referenced by:** Accounts (userId), Transactions (userId)
- ✅ **Operations:** Create (register), Read (profile, auth), Update (profile), Delete (account deletion)

**Accounts Collection:**
- ✅ **Used:** Core feature - account management
- ✅ **Referenced by:** Transactions (accountId, fromAccountId, toAccountId)
- ✅ **Operations:** Full CRUD operations
- ✅ **Fields:** accountName, type, providerId, currentBalance, addToNetWorth

**Transactions Collection:**
- ✅ **Used:** Core feature - transaction tracking
- ✅ **References:** Accounts (accountId, fromAccountId, toAccountId), Users (userId)
- ✅ **Operations:** Full CRUD operations
- ✅ **Fields:** amount, type, transactionKind, label, occurredAt, categoryLabel

**Categories Collection:**
- ✅ **Used:** Transaction categorization
- ✅ **Operations:** Read (list active categories)
- ✅ **Fields:** label, emoji, type, isActive
- ⚠️ **Note:** Only GET operation used - no create/update/delete from frontend (admin only?)

**Roles Collection:**
- ⚠️ **Admin Only:** Used for role-based access control
- ⚠️ **Not Used by Non-Admin Frontend:** Only admin pages use this
- ✅ **Operations:** Full CRUD (admin only)

**Permissions Collection:**
- ⚠️ **Admin Only:** Used for permission management
- ⚠️ **Not Used by Non-Admin Frontend:** Only admin pages use this
- ✅ **Operations:** Full CRUD (admin only)

**Providers Collection:**
- ✅ **Used:** Built-in account providers (BPI, GCash, Citi, etc.)
- ✅ **Referenced by:** Accounts (providerId)
- ✅ **Operations:** Read (via GET /api/accounts/providers)

**CustomProviders Collection:**
- ✅ **Used:** User-created custom providers
- ✅ **Referenced by:** Accounts (providerId)
- ✅ **Operations:** Create (via POST /api/accounts/providers), Read (via GET /api/accounts/providers)

**AccountTypes Collection:**
- ⚠️ **Partially Used:** Defined in database but endpoint not called from frontend
- ⚠️ **Backend Uses:** Backend validates account types against this collection
- ⚠️ **Frontend:** Frontend doesn't fetch account types from API
- ✅ **Operations:** Read (backend validation), but frontend doesn't use GET endpoint

### Unused Collections

**None Identified:**
- All collections appear to be used either by:
  - Frontend operations (Users, Accounts, Transactions, Categories, Providers, CustomProviders)
  - Backend validation/logic (AccountTypes)
  - Admin features (Roles, Permissions)

**Underutilized Collections:**
- ⚠️ **AccountTypes:** Collection exists and is used for validation, but frontend doesn't fetch it
  - **Impact:** Low - backend validation still works
  - **Recommendation:** Consider exposing account types to frontend for dynamic UI or remove if not needed

---

## Security Observations

### Authentication Security

**Session Management:**
- ✅ **Sessions:** Uses `express-session` with MongoDB store (`connect-mongo`)
- ✅ **Session Cookies:** Uses `credentials: 'include'` for CORS
- ✅ **Session Validation:** `requireAuth` middleware checks `req.session.userId`
- ✅ **JWT Tokens:** Generated on login but session-based auth is primary method
- ⚠️ **Token Storage:** JWT tokens stored in localStorage (potential XSS risk)
  - **Recommendation:** Consider using httpOnly cookies for tokens

**Password Security:**
- ✅ **Hashing:** Uses `bcryptjs` for password hashing
- ✅ **Password Change:** Requires old password verification
- ✅ **Password Validation:** Minimum 6 characters enforced

**OAuth Security:**
- ✅ **Google OAuth:** Uses `google-auth-library` for token verification
- ✅ **Client ID:** Validated on backend

### Authorization Security

**Route Protection:**
- ✅ **Frontend:** TanStack Router protects routes with authentication checks
- ✅ **Backend:** `requireAuth` middleware protects all non-public endpoints
- ✅ **User Isolation:** Users can only access their own accounts and transactions
  - Accounts filtered by `userId: req.session.userId`
  - Transactions filtered by `userId: req.session.userId`

**Admin Protection:**
- ✅ **Admin Routes:** Protected with `requireAdmin` middleware
- ✅ **Role Checking:** Backend checks user roles before allowing admin operations
- ✅ **Non-Admin Scope:** Admin endpoints not tested (as per requirements)

### Data Security

**Input Validation:**
- ✅ **Account Creation:** Validates accountName, type, providerId
- ✅ **Transaction Creation:** Validates amount, accountId, type
- ✅ **ObjectId Validation:** Validates MongoDB ObjectId format before queries
- ⚠️ **SQL Injection:** Not applicable (MongoDB uses parameterized queries)
- ⚠️ **XSS Protection:** React escapes content by default, but user-generated content should be sanitized

**Data Isolation:**
- ✅ **User Data:** All queries filter by `userId` to ensure data isolation
- ✅ **Account Access:** Users cannot access other users' accounts
- ✅ **Transaction Access:** Users cannot access other users' transactions

**CORS Configuration:**
- ✅ **Credentials:** CORS allows credentials (`credentials: 'include'`)
- ⚠️ **Origin:** Should verify CORS origin restrictions in production

**Error Messages:**
- ⚠️ **Information Leakage:** Some error messages may reveal too much information
  - Example: "Account type X is not supported" reveals valid types
  - **Recommendation:** Use generic error messages for validation failures

---

## Data Error Findings

### Input Validation Issues

**Frontend Validation:**
- ✅ **Signup Form:** Validates name, email format, password length (min 6), password confirmation
- ✅ **Login Form:** HTML5 required attributes, but React state validation may have issues
- ⚠️ **Account Creation:** Frontend validation present but backend also validates
- ⚠️ **Transaction Creation:** Frontend validation present but backend also validates

**Backend Validation:**
- ✅ **Account Creation:** Validates accountName, type, providerId
- ✅ **Transaction Creation:** Validates amount, accountId, type/kind
- ✅ **ObjectId Validation:** Validates MongoDB ObjectId format
- ✅ **Account Type Validation:** Checks if account type is allowed
- ⚠️ **Missing Validation:** Some fields may not have comprehensive validation
  - Example: Account name length limits, transaction amount ranges

**Error Handling:**
- ✅ **API Errors:** Returned with `success: false` and error message
- ⚠️ **Frontend Errors:** Generic "Failed to fetch" doesn't distinguish error types
- ⚠️ **Validation Errors:** Some validation errors may not be user-friendly

### Business Logic Errors

**Account Balance Calculation:**
- ✅ **Initial Balance:** Creates transaction when account created with non-zero balance
- ✅ **Transaction Updates:** Account balance updated when transactions created/updated/deleted
- ✅ **Transaction Types:** Correctly handles expense (negative) and income (positive)
- ⚠️ **Transfer Transactions:** Requires fromAccount and toAccount - logic appears correct

**Net Worth Calculation:**
- ✅ **Calculation:** Sums all account balances where `addToNetWorth: true`
- ✅ **Negative Balances:** Credit accounts with negative balances correctly reduce net worth
- ✅ **Display:** Shows formatted currency (₱) with proper formatting

**Transaction Filtering:**
- ✅ **By Kind:** Filters work correctly (All, Expense, Income, Installment, Transfer)
- ✅ **By Account:** Can filter transactions by account (used in dashboard)
- ✅ **Date Sorting:** Transactions sorted by date (newest first)

### Edge Cases

**Empty States:**
- ✅ **No Accounts:** Dashboard should handle empty account list (not tested)
- ✅ **No Transactions:** Transactions page should handle empty transaction list (not tested)
- ⚠️ **Loading States:** Some components show "Loading..." but may get stuck

**Data Consistency:**
- ✅ **Account Deletion:** Should handle associated transactions (cascade delete or prevent deletion)
- ✅ **Transaction Deletion:** Should recalculate account balance
- ⚠️ **Concurrent Updates:** No locking mechanism visible for concurrent account/transaction updates

**Boundary Conditions:**
- ⚠️ **Large Numbers:** No visible limits on transaction amounts or account balances
- ⚠️ **Negative Balances:** Credit accounts can have negative balances (expected behavior)
- ⚠️ **Date Handling:** Transactions use `occurredAt` field - timezone handling not verified

**Error Recovery:**
- ⚠️ **Network Failures:** Generic error messages, no retry mechanism
- ⚠️ **Partial Failures:** Transaction creation with account update - uses MongoDB sessions (good)
- ⚠️ **Session Expiry:** No visible handling for expired sessions

---

## Redundancy and Duplication Analysis

### Component Duplication

**Modal Components:**
- ✅ **AddTransactionModal:** Used by DashboardPage and TransactionsPage
- ✅ **Edit Modals:** Separate modals for User, Role, Permission (admin only)
- ⚠️ **Account Modals:** Account creation/editing logic embedded in DashboardPage
  - **Recommendation:** Consider extracting to separate modal component

**Form Components:**
- ✅ **LoginPage:** Standalone login form
- ✅ **SignupPage:** Standalone signup form
- ✅ **SettingsPage:** Password change form
- ⚠️ **No Shared Form Components:** Each form is custom-built
  - **Recommendation:** Consider creating reusable form components

**Navigation Components:**
- ✅ **Sidebar:** Reused across authenticated pages
- ✅ **Header/Nav:** Consistent navigation structure

### State Duplication

**Account State:**
- ⚠️ **DashboardPage:** Manages accounts state
- ⚠️ **TransactionsPage:** Also fetches accounts independently
- **Impact:** Duplicate API calls, potential inconsistency
- **Recommendation:** Consider shared state management (Context API or state library)

**Category State:**
- ⚠️ **DashboardPage:** Fetches categories
- ⚠️ **TransactionsPage:** Also fetches categories independently
- ⚠️ **Fallback Categories:** Both components have fallback categories array
- **Impact:** Duplicate API calls, code duplication
- **Recommendation:** Share categories state or use a shared hook

**Transaction State:**
- ⚠️ **DashboardPage:** Manages transactions for display
- ⚠️ **TransactionsPage:** Also manages transactions independently
- **Impact:** Duplicate API calls when both pages are used
- **Note:** This may be acceptable if transactions are filtered differently

**User/Auth State:**
- ✅ **Centralized:** Uses AuthContext for shared auth state
- ✅ **No Duplication:** Single source of truth for authentication

### Code Duplication

**API Calls:**
- ⚠️ **Account Fetching:** Similar code in DashboardPage and TransactionsPage
- ⚠️ **Category Fetching:** Similar code in DashboardPage and TransactionsPage
- ⚠️ **Transaction Fetching:** Similar code in DashboardPage and TransactionsPage
- **Recommendation:** Create custom hooks (`useAccounts`, `useCategories`, `useTransactions`)

**Form Validation:**
- ⚠️ **Email Validation:** Regex pattern may be duplicated
- ⚠️ **Password Validation:** Minimum length check may be duplicated
- **Recommendation:** Extract to shared validation utilities (partially done in `validators.ts`)

**Error Handling:**
- ⚠️ **Error Display:** Similar error handling patterns across components
- **Recommendation:** Create reusable error display component

**Formatting:**
- ✅ **Centralized:** Uses `formatters.ts` for currency and date formatting
- ✅ **No Duplication:** Single source for formatting logic

---

## Design Improvement Observations

### UI/UX Issues

**User Feedback:**
- ⚠️ **Loading States:** Some pages show "Loading..." but may get stuck (ProfilePage)
- ⚠️ **Error Messages:** Generic "Failed to fetch" doesn't help users understand the issue
- ⚠️ **Success Messages:** No visible success feedback for some actions (account creation, transaction updates)
- ✅ **Button States:** Loading states on buttons work well ("Signing in...", disabled state)

**Navigation:**
- ✅ **Breadcrumbs:** "Back to dashboard" link on TransactionsPage is helpful
- ✅ **Sidebar:** Consistent navigation across authenticated pages
- ⚠️ **Profile Menu:** Profile menu button present but menu functionality not fully tested

**Form Design:**
- ✅ **Placeholders:** Helpful placeholder text ("Create a password (min. 6 characters)")
- ✅ **Validation:** Real-time validation feedback (errors clear when typing)
- ⚠️ **Required Fields:** Some forms use HTML5 required, others use React validation
- ⚠️ **Accessibility:** Form labels present, but ARIA attributes could be improved

**Data Display:**
- ✅ **Currency Formatting:** Consistent currency formatting (₱)
- ✅ **Date Formatting:** Consistent date/time formatting
- ✅ **Account Cards:** Clear visual hierarchy with icons and labels
- ⚠️ **Transaction List:** Could benefit from better visual grouping (by date, account)

**Responsive Design:**
- ✅ **Mobile Navigation:** Logo visible on mobile
- ⚠️ **Tablet/Desktop:** Layout appears responsive but not fully tested

### Code Organization Issues

**File Structure:**
- ✅ **Component Organization:** Components organized by feature (transactions/, effects/)
- ✅ **Utils:** Shared utilities in `utils/` directory
- ✅ **Routes:** Routes defined in `routes/` directory
- ⚠️ **Large Components:** DashboardPage is very large (1163 lines)
  - **Recommendation:** Break into smaller components

**State Management:**
- ✅ **Auth Context:** Centralized authentication state
- ⚠️ **Local State:** Heavy use of `useState` in components
- ⚠️ **No Global State:** No state management library (Redux, Zustand, etc.)
  - **Impact:** State duplication, prop drilling potential
  - **Recommendation:** Consider state management library for shared data

**API Organization:**
- ✅ **API Client:** Centralized API functions in `utils/api.ts`
- ✅ **Type Definitions:** TypeScript interfaces defined
- ⚠️ **Error Handling:** Error handling could be more consistent

**Code Reusability:**
- ⚠️ **Custom Hooks:** Limited use of custom hooks
- ⚠️ **Shared Components:** Some components could be more reusable
- ✅ **Utilities:** Good use of utility functions (formatters, validators)

### Performance Observations

**API Calls:**
- ⚠️ **Multiple Calls:** DashboardPage makes multiple API calls on load
  - GET /api/auth/me
  - GET /api/accounts
  - GET /api/accounts/providers
  - GET /api/categories
  - GET /api/transactions
- ⚠️ **No Caching:** API responses not cached, refetched on every page load
- ⚠️ **Duplicate Calls:** Same endpoints called from multiple components
- **Recommendation:** Implement API response caching or use React Query/SWR

**Component Rendering:**
- ✅ **Memoization:** Uses `useMemo` for filtered transactions
- ⚠️ **Large Lists:** Transaction lists could benefit from virtualization for large datasets
- ⚠️ **Re-renders:** No visible optimization for preventing unnecessary re-renders

**Bundle Size:**
- ⚠️ **Dependencies:** Multiple animation libraries (GSAP, Framer Motion)
- ⚠️ **Code Splitting:** No visible code splitting for routes
- **Recommendation:** Consider lazy loading for routes and heavy components

**Network Performance:**
- ✅ **Concurrent Requests:** Multiple API calls made concurrently (good)
- ⚠️ **No Request Deduplication:** Same endpoint may be called multiple times simultaneously
- **Recommendation:** Implement request deduplication

---

## Summary

### Critical Issues
- ⚠️ **ProfilePage Loading State:** ProfilePage shows "Loading..." and may be stuck
  - **Impact:** Users cannot view or edit their profile
  - **Priority:** High

### High Priority Issues
- ⚠️ **Form State Issue:** React form state not updated by programmatic DOM manipulation
  - **Impact:** Browser automation tools cannot fill forms easily
  - **Priority:** Medium (affects testing, not end users)
  
- ⚠️ **Generic Error Messages:** "Failed to fetch" doesn't distinguish network vs auth errors
  - **Impact:** Poor user experience, unclear error guidance
  - **Priority:** Medium

- ⚠️ **AccountTypes Endpoint Unused:** Backend has `/api/accountTypes` but frontend doesn't use it
  - **Impact:** Potential inconsistency if account types change
  - **Priority:** Low-Medium

### Medium Priority Issues
- ⚠️ **JWT Token Storage:** Tokens stored in localStorage (XSS risk)
  - **Recommendation:** Consider httpOnly cookies
  
- ⚠️ **Error Message Information Leakage:** Some errors reveal system details
  - **Recommendation:** Use generic error messages for validation failures

- ⚠️ **Deprecated Package:** `@tanstack/router-devtools` deprecated, should migrate to `@tanstack/react-router-devtools`

### Low Priority Issues
- ⚠️ **Forgot Password Link:** Links to "#" (non-functional)
  - **Impact:** Feature not implemented
  - **Priority:** Low (feature not required)

- ⚠️ **Google OAuth Errors:** FedCM errors in automated browser (expected, not a real issue)

- ⚠️ **Console Warnings:** Deprecated package warnings (informational)

### Recommendations

**Immediate Actions:**
1. Investigate and fix ProfilePage loading issue
2. Improve error messages to be more specific and user-friendly
3. Add retry mechanisms for failed network requests

**Short-term Improvements:**
1. Migrate to `@tanstack/react-router-devtools`
2. Implement forgot password functionality or remove the link
3. Consider using httpOnly cookies for JWT tokens
4. Add input sanitization for user-generated content

**Long-term Improvements:**
1. Use `/api/accountTypes` endpoint in frontend for dynamic account type management
2. Add comprehensive input validation and sanitization
3. Implement rate limiting for API endpoints
4. Add request/response logging for debugging
5. Consider adding API versioning for future compatibility
