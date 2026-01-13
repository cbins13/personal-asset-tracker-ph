import { createFileRoute, redirect } from '@tanstack/react-router'
import SignupPage from '../components/SignupPage'
import { authApi } from '../utils/api'

export const Route = createFileRoute('/signup')({
  beforeLoad: async ({ location }) => {
    try {
      const response = await authApi.getCurrentUser()
      if (response.success) {
        throw redirect({ to: '/dashboard', search: { redirect: location.href } })
      }
    } catch {
      // allow signup when not authenticated
    }
  },
  component: SignupPage,
})
