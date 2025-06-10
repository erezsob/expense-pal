import { FormEvent } from 'react'
import { toast } from 'sonner'

import { Id } from '../convex/_generated/dataModel'
import { api } from '../convex/_generated/api'
import { useState } from 'react'
import { Button } from './components/ui/button'
import { Text } from './components/ui/text'
import { Input } from './components/ui/input'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

interface MembersTabProps {
  groupId: Id<'groups'>
  members: { userId: Id<'users'>; name: string; email?: string | null }[]
}

export function MembersTab({ groupId, members }: MembersTabProps) {
  const { mutate: inviteUser } = useMutation({
    mutationFn: useConvexMutation(api.groups.inviteUserToGroup),
  })
  const [emailToInvite, setEmailToInvite] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const handleInviteUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!emailToInvite.trim()) {
      toast.error('Email is required to invite a user.')
      return
    }
    setIsInviting(true)
    inviteUser(
      { groupId, emailToInvite },
      {
        onSuccess: () => {
          toast.success(
            `Invitation sent to ${emailToInvite} (if they are a registered user).`,
          )
          setEmailToInvite('')
          setIsInviting(false)
        },
        onError: (error: unknown) => {
          if (error instanceof Error) {
            toast.error(`Failed to invite user: ${error.message}`)
          }
          setIsInviting(false)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleInviteUser}
        className="mx-auto w-full max-w-md space-y-4"
      >
        <div>
          <Text className="mb-1 text-lg font-semibold">Invite New Member</Text>
          <Text variant="muted" className="mb-2 text-sm">
            Invite a new member to your group by email.
          </Text>
        </div>
        <div className="space-y-2">
          <Text className="font-medium">User's Email</Text>
          <Input
            id="inviteEmail"
            type="email"
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            placeholder="user@example.com"
            disabled={isInviting}
            className="w-full"
          />
        </div>
        <Button type="submit" disabled={isInviting} className="w-full">
          {isInviting ? 'Inviting...' : 'Invite User'}
        </Button>
      </form>

      <div>
        <h3 className="mb-3 text-xl font-semibold">Current Members</h3>
        {members.length === 0 ? (
          <p className="">No members in this group yet.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.userId}
                className="border-light bg-background rounded-md border p-3 shadow-sm"
              >
                <p className="font-medium">{member.name}</p>
                {member.email && <p className="text-sm">{member.email}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
