import { createFileRoute, redirect } from '@tanstack/react-router'
import ProfilePage from '../components/ProfilePage'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: ProfilePage,
})
