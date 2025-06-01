import { ModeToggle } from '../components/mode-toggle'
import { SignOutButton } from '@/SignOutButton'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-light px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-primary">SplitEase</h2>
          <div className="flex items-center gap-2">
            <SignOutButton />
            <ModeToggle />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
        <Toaster richColors position="top-right" />
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})
