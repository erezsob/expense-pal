import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { toast } from 'sonner'
import { CreateGroupForm } from './CreateGroupForm'
import { GroupList } from './GroupList'
import { useNavigate } from '@tanstack/react-router'

export function Home() {
  const loggedInUser = useQuery(api.auth.loggedInUser)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="text-center">
        <h1 className="mb-1 text-2xl font-bold sm:text-3xl">Your Groups</h1>
        <p className="text-md sm:text-lg">
          Welcome back,{' '}
          <span className="text-primary font-medium">
            {loggedInUser?.name ?? loggedInUser?.email}!
          </span>
        </p>
      </div>

      <div className="card">
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
          Create a New Group
        </h2>
        <CreateGroupForm
          onSuccess={(groupId) => {
            toast.success('Group created successfully!')
            navigate({ to: `/groups/${groupId}` })
          }}
        />
      </div>

      <div className="card">
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
          Existing Groups
        </h2>
        <GroupList
          onSelectGroup={(groupId) => navigate({ to: `/groups/${groupId}` })}
        />
      </div>
    </div>
  )
}
