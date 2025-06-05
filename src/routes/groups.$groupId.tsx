import { toast } from 'sonner'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Id } from '../../convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Doc } from '../../convex/_generated/dataModel'

import { ExpensesTab } from '../ExpensesTab'
import { PaymentsTab } from '../PaymentsTab'
import { MembersTab } from '../MembersTab'
import { BalancesTab } from '../BalancesTab'
import { SettingsTab } from '../SettingsTab'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupView,
})

const TABS = ['expenses', 'members', 'balances', 'settings'] as const

export function GroupView() {
  const { groupId: groupIdString } = Route.useParams()
  const groupId = groupIdString as Id<'groups'>
  const groupDetails = useQuery(api.groups.getGroupDetails, { groupId })
  const expenses = useQuery(api.expenses.getExpensesForGroup, { groupId })
  const payments = useQuery(api.payments.getPaymentsForGroup, { groupId })
  const balances = useQuery(api.balances.getGroupBalances, { groupId })
  const loggedInUser = useQuery(api.auth.loggedInUser)

  const navigate = useNavigate()
  const handleBackClick = () => navigate({ to: '/' })

  if (
    groupDetails === undefined ||
    expenses === undefined ||
    payments === undefined ||
    balances === undefined ||
    loggedInUser === undefined
  ) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!groupDetails || balances === null || !loggedInUser) {
    toast.error('Group details or balances could not be loaded.')
    handleBackClick()
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-error">
          Error loading group data. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-6">
      <Button onClick={handleBackClick} variant="link" className="p-0">
        &larr; Back to Groups
      </Button>
      <header>
        <h1 className="text-primary text-2xl font-bold sm:text-3xl">
          {groupDetails.name}
        </h1>
        <p className="">Currency: {groupDetails.currency}</p>
      </header>

      <Tabs defaultValue="expenses">
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              <Text className="capitalize">{tab}</Text>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="expenses">
          <ExpensesTab
            groupId={groupId}
            expenses={expenses}
            currency={groupDetails.currency}
          />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab
            groupId={groupId}
            members={
              groupDetails.members as { userId: Id<'users'>; name: string }[]
            }
          />
        </TabsContent>
        <TabsContent value="balances">
          <BalancesTab balances={balances} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab
            groupDetails={
              groupDetails as Doc<'groups'> & {
                members: {
                  userId: Id<'users'>
                  name: string
                  email?: string | null
                }[]
              }
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
