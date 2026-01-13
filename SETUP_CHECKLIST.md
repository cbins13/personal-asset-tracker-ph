# Setup Checklist - Registration & Login

## ✅ Prerequisites

### 1. Backend Setup
- [ ] MongoDB Atlas connection string configured in `backend/.env`
- [ ] Backend dependencies installed: `cd backend && npm install`
- [ ] Backend server running: `cd backend && npm run dev`
- [ ] Server accessible at `http://localhost:5002`

### 2. Frontend Setup
- [ ] Frontend dependencies installed: `npm install`
- [ ] Frontend dev server running: `npm run dev`
- [ ] Frontend accessible at `http://localhost:5173`

### 3. Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5002
NODE_ENV=development
MONGODB_URI=your-mongodb-atlas-connection-string
SESSION_SECRET=your-random-secret-key
JWT_SECRET=your-random-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
FRONTEND_URL=http://localhost:5173
```

**Frontend (`.env`):**
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_URL=http://localhost:5002/api  # Optional, defaults to this
```

## 🧪 Testing Registration & Login

### Test Registration:
1. Navigate to `http://localhost:5173/signup`
2. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123` (min 6 characters)
   - Confirm Password: `password123`
3. Click "Sign up"
4. Should see success message and redirect to login page

### Test Login:
1. Navigate to `http://localhost:5173/login`
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Sign in"
4. Should redirect to home page

## 🔍 Troubleshooting

### Backend not connecting?
- Check if backend is running: `curl http://localhost:5002/api/health`
- Check MongoDB connection in backend logs
- Verify CORS settings in `backend/server.js`

### Frontend can't reach backend?
- Check browser console for CORS errors
- Verify `VITE_API_URL` in frontend `.env`
- Check backend is running on port 5002

### Registration fails?
- Check backend logs for errors
- Verify MongoDB connection
- Check password meets requirements (min 6 chars)

### Login fails?
- Verify user was created successfully
- Check password is correct
- Check backend logs for authentication errors
