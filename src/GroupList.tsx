import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'

interface GroupListProps {
  onSelectGroup: (groupId: Id<'groups'>) => void
}

export function GroupList({ onSelectGroup }: GroupListProps) {
  const groups = useQuery(api.groups.getGroupsForUser)

  if (groups === undefined) {
    return (
      <div className="text-center py-4 text-on-surface-secondary">
        Loading groups...
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <p className="text-on-surface-secondary text-center py-4">
        You are not part of any groups yet. Create one above!
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {groups.map((group) => (
        <li
          key={group!._id}
          className="p-4 bg-background rounded-md border border-light hover:shadow-lg transition-shadow cursor-pointer flex justify-between items-center"
          onClick={() => onSelectGroup(group!._id)}
        >
          <div>
            <h3 className="text-lg font-semibold text-primary">
              {group!.name}
            </h3>
            <p className="text-sm text-on-surface-secondary">
              Currency: {group!.currency}
            </p>
          </div>
          <span className="text-lg text-primary">&#x276F;</span>{' '}
          {/* Right arrow */}
        </li>
      ))}
    </ul>
  )
}
