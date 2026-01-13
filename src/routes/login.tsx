import { createFileRoute, redirect } from '@tanstack/react-router'
import LoginPage from '../components/LoginPage'
import { authApi } from '../utils/api'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ location }) => {
    try {
      const response = await authApi.getCurrentUser()
      if (response.success) {
        throw redirect({ to: '/dashboard', search: { redirect: location.href } })
      }
    } catch (error) {
      // ignore and allow login page if unauthenticated
    }
  },
  component: LoginPage,
})
