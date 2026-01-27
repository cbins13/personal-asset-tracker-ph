import { createFileRoute, redirect } from '@tanstack/react-router'
import LandingPage from '../components/LandingPage'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // Use context.auth instead of direct API call (as per TanStack Router docs)
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})
