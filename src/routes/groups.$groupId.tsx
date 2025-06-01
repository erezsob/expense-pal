import { useState } from 'react'
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

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupView,
})

interface GroupViewProps {
  groupId: Id<'groups'>
}

export function GroupView({ groupId }: GroupViewProps) {
  const groupDetails = useQuery(api.groups.getGroupDetails, { groupId })
  const expenses = useQuery(api.expenses.getExpensesForGroup, { groupId })
  const payments = useQuery(api.payments.getPaymentsForGroup, { groupId })
  const balances = useQuery(api.balances.getGroupBalances, { groupId })
  const loggedInUser = useQuery(api.auth.loggedInUser)

  const [activeTab, setActiveTab] = useState<
    'expenses' | 'payments' | 'members' | 'balances' | 'settings'
  >('expenses')

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

      <div className="border-light flex border-b">
        {(
          ['expenses', 'payments', 'members', 'balances', 'settings'] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button capitalize ${
              activeTab === tab ? 'tab-button-active' : 'tab-button-inactive'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'expenses' && expenses && (
          <ExpensesTab
            groupId={groupId}
            expenses={expenses}
            currency={groupDetails.currency}
          />
        )}
        {activeTab === 'payments' && payments && (
          <PaymentsTab
            groupId={groupId}
            payments={payments}
            members={
              groupDetails.members as { userId: Id<'users'>; name: string }[]
            }
            currency={groupDetails.currency}
            loggedInUserId={loggedInUser._id}
          />
        )}
        {activeTab === 'members' && (
          <MembersTab
            groupId={groupId}
            members={
              groupDetails.members as {
                userId: Id<'users'>
                name: string
                email?: string | null
              }[]
            }
          />
        )}
        {activeTab === 'balances' && balances && (
          <BalancesTab balances={balances} />
        )}
        {activeTab === 'settings' && (
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
        )}
      </div>
    </div>
  )
}
