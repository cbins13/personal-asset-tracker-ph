import { createFileRoute, redirect } from '@tanstack/react-router'
import RolesPage from '../components/RolesPage'

export const Route = createFileRoute('/admin/roles')({
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
  component: RolesPage,
})
