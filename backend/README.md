# Savvi - Backend Server

Express.js backend server with MongoDB Atlas integration for user authentication and data management.

## Features

- ✅ MongoDB Atlas connection
- ✅ User authentication (Google OAuth + Local)
- ✅ Session management with MongoDB store
- ✅ JWT token generation
- ✅ RESTful API endpoints
- ✅ CORS configuration for frontend

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your MongoDB Atlas connection string
   - Add your session and JWT secrets
   - Configure Google OAuth credentials

3. **Get MongoDB Atlas connection string:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster (free tier available)
   - Get your connection string from "Connect" → "Connect your application"
   - Replace `<password>` with your database user password

4. **Generate secrets:**
   ```bash
   # Generate random strings for SESSION_SECRET and JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5002` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Authentication (`/api/auth`)
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/register` - Local user registration
- `POST /api/auth/login` - Local user login
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user from session

### Users (`/api/users`)
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

## Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
backend/
├── config/
│   └── database.js       # MongoDB connection
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   └── User.js           # User schema
├── routes/
│   ├── auth.js           # Authentication routes
│   └── users.js          # User routes
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
├── server.js             # Main server file
└── README.md
```

## Security Notes

- ⚠️ Password hashing with bcrypt is recommended for production
- ⚠️ Use HTTPS in production
- ⚠️ Keep your secrets secure and never commit `.env` file
- ⚠️ Configure proper CORS origins for production
