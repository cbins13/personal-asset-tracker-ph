import { createFileRoute, redirect } from '@tanstack/react-router'
import SignupPage from '../components/SignupPage'

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    // Use context.auth instead of direct API call (as per TanStack Router docs)
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: SignupPage,
})
