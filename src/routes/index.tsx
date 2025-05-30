import { createFileRoute, Navigate } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { useQuery } from 'convex/react'
import { Home } from '@/Home'

export const Route = createFileRoute('/')({
  component: Index,
})

export function Index() {
  const loggedInUser = useQuery(api.auth.loggedInUser)

  if (loggedInUser === undefined) {
    return <div>Loading...</div>
  }

  if (!loggedInUser) {
    return <Navigate to="/login" />
  }

  return <Home />
}
