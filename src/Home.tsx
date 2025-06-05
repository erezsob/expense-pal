import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { toast } from 'sonner'
import { CreateGroupForm } from './CreateGroupForm'
import { GroupList } from './GroupList'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Text } from './components/ui/text'

export function Home() {
  const loggedInUser = useQuery(api.auth.loggedInUser)
  const navigate = useNavigate()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Your Groups
        </h1>
        <Text variant="lead">
          Welcome back,{' '}
          <span className="text-primary font-medium">
            {loggedInUser?.name ?? loggedInUser?.email}
          </span>
        </Text>
      </div>

      <div className="grid gap-6 sm:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateGroupForm
              onSuccess={(groupId) => {
                toast.success('Group created successfully!')
                navigate({ to: `/groups/${groupId}` })
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupList
              onSelectGroup={(groupId) =>
                navigate({ to: `/groups/${groupId}` })
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
