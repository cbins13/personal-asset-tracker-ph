import { createFileRoute, redirect } from '@tanstack/react-router'
import DashboardPage from '../components/DashboardPage'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context, location }) => {
    // Use context.auth instead of direct API call (as per TanStack Router docs)
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: DashboardPage,
})
