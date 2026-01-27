import { RouterProvider, createRouter } from '@tanstack/react-router'
import './App.css'
import { useAuth } from './auth'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance with typed context
const router = createRouter({
  routeTree,
  context: {
    // This will be provided at runtime in App via RouterProvider
    auth: undefined!,
  },
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

export default App
