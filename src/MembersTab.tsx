import { FormEvent } from 'react'
import { toast } from 'sonner'

import { Id } from '../convex/_generated/dataModel'
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { useState } from 'react'

interface MembersTabProps {
  groupId: Id<'groups'>
  members: { userId: Id<'users'>; name: string; email?: string | null }[]
}

export function MembersTab({ groupId, members }: MembersTabProps) {
  const inviteUserMutation = useMutation(api.groups.inviteUserToGroup)
  const [emailToInvite, setEmailToInvite] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const handleInviteUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!emailToInvite.trim()) {
      toast.error('Email is required to invite a user.')
      return
    }
    setIsInviting(true)
    try {
      await inviteUserMutation({ groupId, emailToInvite })
      toast.success(
        `Invitation sent to ${emailToInvite} (if they are a registered user).`,
      )
      setEmailToInvite('')
    } catch (error: any) {
      toast.error(`Failed to invite user: ${error.message}`)
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleInviteUser} className="card space-y-3">
        <h3 className="text-lg font-medium">Invite New Member</h3>
        <div>
          <label
            htmlFor="inviteEmail"
            className="mb-1 block text-sm font-medium"
          >
            User's Email
          </label>
          <input
            id="inviteEmail"
            type="email"
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            placeholder="user@example.com"
            className="input-field"
            disabled={isInviting}
          />
        </div>
        <button
          type="submit"
          className={`btn btn-primary ${isInviting ? 'btn-disabled' : ''}`}
          disabled={isInviting}
        >
          {isInviting ? 'Inviting...' : 'Invite User'}
        </button>
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
