# Savvi (PH) - Personal Asset Tracker

## Summary of the Project
Savvi is a personal asset tracking web app with a React-based frontend and an
Express/MongoDB backend. It supports user authentication (Google OAuth and
email/password), session-based access, role/permission management, and core
finance data like accounts, account types, transactions, and categories.

## Repository Architecture
- `src/` - Vite + React TypeScript frontend (routes, UI, hooks, API client).
- `backend/` - Express API server, MongoDB models, auth middleware, and routes.
- `api/` - Vercel Serverless Function entry that proxies requests to the backend
  app for a single-project deployment.
- `public/` - Static assets.

Frontend requests go to `VITE_API_URL` (recommended `/api` for Vercel). In
development it falls back to `http://localhost:5002/api`. These requests map to
the Express app in `backend/app.js` and the serverless bridge in `api/index.js`.

## Technology Stack
- Frontend: React 19, TypeScript, Vite, TanStack Router, Tailwind CSS, Framer
  Motion.
- Backend: Node.js, Express, Mongoose, MongoDB Atlas.
- Auth & Sessions: Google OAuth, JWT, `express-session` with `connect-mongo`.
- Tooling: ESLint, Jest (backend), Vite build pipeline.

## Deployment
This repo is set up to deploy the Vite frontend and Express API as Vercel
Serverless Functions in a single project.

1. Import the repo into Vercel and select the Vite framework preset.
2. Add environment variables in Vercel:
   - Backend: `MONGODB_URI`, `SESSION_SECRET`, `JWT_SECRET`,
     `GOOGLE_CLIENT_ID`, `FRONTEND_URL`
   - Frontend: `VITE_GOOGLE_CLIENT_ID`, `VITE_API_URL=/api`
3. Deploy and verify:
   - `https://<your-domain>.vercel.app/api/health` returns 200
   - The UI loads and can call the API
