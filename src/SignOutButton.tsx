import { useAuthActions } from '@convex-dev/auth/react'
import { Link } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()

  if (!isAuthenticated) {
    return null
  }

  return (
    <Link
      to="/login"
      className="text-primary dark:text-secondary rounded-sm border border-gray-200 bg-white px-4 py-2 font-semibold shadow-sm transition-colors hover:bg-gray-50 hover:shadow"
      onClick={() => void signOut()}
    >
      Sign out
    </Link>
  )
}
