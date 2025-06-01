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

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupView,
})

const tabs = [
  'expenses',
  'payments',
  'members',
  'balances',
  'settings',
] as const

export function GroupView() {
  const { groupId: groupIdString } = Route.useParams()
  const groupId = groupIdString as Id<'groups'>
  console.log('TCL: ~ GroupView ~ groupId:', groupId)
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
    <div className="space-y-6">
      <button onClick={handleBackClick} className="btn btn-ghost mb-2 text-sm">
        &larr; Back to Groups
      </button>
      <header className="border-light border-b pb-4">
        <h1 className="text-primary text-2xl font-bold sm:text-3xl">
          {groupDetails.name}
        </h1>
        <p className="">Currency: {groupDetails.currency}</p>
      </header>

      <Tabs defaultValue="expenses">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
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
        <TabsContent value="payments">
          <PaymentsTab
            groupId={groupId}
            payments={payments}
            members={
              groupDetails.members as { userId: Id<'users'>; name: string }[]
            }
            currency={groupDetails.currency}
            loggedInUserId={loggedInUser._id}
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
