import { createFileRoute, redirect } from '@tanstack/react-router'
import UserManagementPage from '../components/UserManagementPage'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: ({ context, location }) => {
    const auth = context.auth

    if (!auth.isAuthenticated || !auth.hasRole('admin')) {
      throw redirect({
        to: '/dashboard',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: UserManagementPage,
})

