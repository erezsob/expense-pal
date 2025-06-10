import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { Text } from './components/ui/text'
import { Spacer } from './components/ui/spacer'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'

interface GroupListProps {
  onSelectGroup: (groupId: Id<'groups'>) => void
}

export function GroupList({ onSelectGroup }: GroupListProps) {
  const { data: groups, isLoading: isGroupsLoading } = useQuery(
    convexQuery(api.groups.getGroupsForUser, {}),
  )

  if (isGroupsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Text variant="muted">Loading groups...</Text>
      </div>
    )
  }

  if (groups?.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Text variant="muted">
          You are not part of any groups yet. Create one above!
        </Text>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {groups?.map((group) => (
        <button
          key={group!._id}
          onClick={() => onSelectGroup(group!._id)}
          className="group bg-card hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all"
        >
          <div>
            <Text className="font-semibold">{group!.name}</Text>
            <Text variant="muted" className="text-sm">
              Currency: {group!.currency}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Text variant="muted" className="text-sm">
              View details
            </Text>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
