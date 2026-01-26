import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import type { AuthState } from '../auth'
import AnimatedContentWrapper from '../effects/AnimatedContentWrapper'

interface MyRouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => {
    const pathname = useRouterState({ select: (state) => state.location.pathname })
    return (
      <>
        <AnimatedContentWrapper key={pathname}>
          <Outlet />
        </AnimatedContentWrapper>
        <TanStackRouterDevtools />
      </>
    )
  },
})
