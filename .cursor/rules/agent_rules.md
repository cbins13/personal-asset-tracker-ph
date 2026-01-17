# Repo rules (simple)

# Commands
- `npm run dev`: Frontend dev server (Vite)
- `npm run build`: Frontend build
- `npm run lint`: Frontend lint
- `npm run dev` (from `backend/`): Backend dev server (nodemon)
- `npm run start` (from `backend/`): Backend prod server

# Code style
- Use ES modules (`import`/`export`), no CommonJS.
- Prefer existing patterns/utilities over new ones.
- Keep changes scoped to the correct layer: frontend in `src/`, backend in `backend/`.
- For API calls, use `src/utils/api.ts` helpers; keep `credentials: 'include'`.
- For auth/permissions, use `src/auth.tsx` and `src/hooks/usePermissions.ts`.

# Project structure
- Frontend routes: `src/routes/` (do not edit `src/routeTree.gen.ts`).
- Frontend components: `src/components/`.
- Backend routes: `backend/routes/` and mounted in `backend/server.js`.
- Backend models: `backend/models/`.

# Workflow
- Plan before multi-file changes; list files and endpoints to touch.
- If you change an API response, update frontend types/callers too.
- Keep rules short; add only when a repeated mistake occurs.
