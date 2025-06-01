import { createFileRoute, Navigate } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { useQuery } from 'convex/react'
import { Home } from '@/Home'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/')({
  component: Index,
})

export function Index() {
  const loggedInUser = useQuery(api.auth.loggedInUser)

  if (loggedInUser === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!loggedInUser) {
    return <Navigate to="/login" />
  }

  return <Home />
}
