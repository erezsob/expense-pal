import { ModeToggle } from '../components/mode-toggle';
import { SignOutButton } from '@/SignOutButton';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from 'sonner';

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="bg-background flex min-h-screen flex-col">
        <header className="bg-surface/90 border-light sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <h2 className="text-primary text-xl font-semibold">SplitEase</h2>
          <div className="flex items-center gap-2">
            <SignOutButton />
            <ModeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-4xl">
            <Outlet />
          </div>
        </main>
        <Toaster richColors position="top-right" />
      </div>
      <TanStackRouterDevtools />
    </>
  ),
});
