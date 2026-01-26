import { createFileRoute, redirect } from '@tanstack/react-router'
import ProfilePage from '../components/ProfilePage'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context, location }) => {
    // Wait for auth to finish loading before checking authentication
    // If still loading, let the component handle the loading state
    if (context.auth.isLoading) {
      // Don't redirect while loading - let ProfilePage show loading state
      return
    }
    
    // Only redirect if loading is complete AND user is not authenticated
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
