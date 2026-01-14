import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '../components/LoginPage'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || '/dashboard',
    }
  },
  beforeLoad: ({ context, search }) => {
    // Use context.auth instead of direct API call (as per TanStack Router docs)
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect as string })
    }
  },
  component: LoginPage,
})
