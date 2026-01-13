import { createFileRoute, redirect } from '@tanstack/react-router'
import LandingPage from '../components/LandingPage'
import { authApi } from '../utils/api'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ location }) => {
    try {
      const response = await authApi.getCurrentUser()
      if (response.success) {
        throw redirect({ to: '/dashboard', search: { redirect: location.href } })
      }
    } catch (error) {
      // ignore errors and allow rendering for unauthenticated users
    }
  },
  component: LandingPage,
})
