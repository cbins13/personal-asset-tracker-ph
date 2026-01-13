import { createFileRoute, redirect } from '@tanstack/react-router'
import DashboardPage from '../components/DashboardPage'
import { authApi } from '../utils/api'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    // Check if user is authenticated
    try {
      const response = await authApi.getCurrentUser()
      if (!response.success) {
        throw redirect({
          to: '/login',
          search: {
            redirect: location.href,
          },
        })
      }
    } catch (error) {
      // If it's already a redirect, re-throw it
      if (error && typeof error === 'object' && 'to' in error) {
        throw error
      }
      // Otherwise, redirect to login
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
