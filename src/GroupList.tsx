import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'

interface GroupListProps {
  onSelectGroup: (groupId: Id<'groups'>) => void
}

export function GroupList({ onSelectGroup }: GroupListProps) {
  const groups = useQuery(api.groups.getGroupsForUser)

  if (groups === undefined) {
    return <div className="py-4 text-center">Loading groups...</div>
  }

  if (groups.length === 0) {
    return (
      <p className="py-4 text-center">
        You are not part of any groups yet. Create one above!
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {groups.map((group) => (
        <li
          key={group!._id}
          className="bg-background border-light flex cursor-pointer items-center justify-between rounded-md border p-4 transition-shadow hover:shadow-lg"
          onClick={() => onSelectGroup(group!._id)}
        >
          <div>
            <h3 className="text-primary text-lg font-semibold">
              {group!.name}
            </h3>
            <p className="text-sm">Currency: {group!.currency}</p>
          </div>
          <span className="text-primary text-lg">&#x276F;</span>{' '}
          {/* Right arrow */}
        </li>
      ))}
    </ul>
  )
}
