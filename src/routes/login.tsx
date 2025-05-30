import { SignInForm } from '@/SignInForm'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: Login,
})

export function Login() {
  const loggedInUser = useQuery(api.auth.loggedInUser)

  if (loggedInUser) {
    return <Navigate to="/" />
  }

  return (
    <div className="flex flex-col items-center gap-8 mt-12 text-center">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
          Welcome to SplitEase
        </h1>
        <p className="text-lg sm:text-xl text-on-surface-secondary">
          Sign in to manage your shared expenses effortlessly.
        </p>
      </div>
      <div className="w-full max-w-sm card">
        <SignInForm />
      </div>
    </div>
  )
}
