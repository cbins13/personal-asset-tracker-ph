import { createFileRoute, redirect } from '@tanstack/react-router'
import SettingsPage from '../components/SettingsPage'

export const Route = createFileRoute('/settings')({
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
  component: SettingsPage,
})
