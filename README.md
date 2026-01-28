# Savvi (PH) - Personal Asset Tracker

## URL
https://savvi-ph-h65u.onrender.com

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

## Technology Stack
- Frontend: React 19, TypeScript, Vite, TanStack Router, Tailwind CSS, Framer
  Motion.
- Backend: Node.js, Express, Mongoose, MongoDB Atlas.
- Auth & Sessions: Google OAuth, JWT, `express-session` with `connect-mongo`.
- Tooling: ESLint, Jest (backend), Vite build pipeline.

## Deployment
This repo is set up to deploy the Vite frontend and Express API on Render as Web Services.
