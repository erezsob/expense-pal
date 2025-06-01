import { GroupBalances } from '../convex/balances'

interface BalancesTabProps {
  balances: GroupBalances
}

export function BalancesTab({ balances }: BalancesTabProps) {
  if (!balances) {
    return <p>Loading balances...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-xl font-semibold">Member Balances</h3>
        <ul className="space-y-2">
          {balances.members.map((member) => (
            <li
              key={member.userId}
              className={`flex items-center justify-between rounded-md border p-3 shadow-sm ${member.balance >= -0.001 ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}
            >
              <span className="font-medium">{member.name}</span>
              <span
                className={`font-semibold ${member.balance >= -0.001 ? 'text-success' : 'text-error'}`}
              >
                {member.balance >= -0.001 ? '+' : ''}
                {parseFloat(member.balance.toFixed(2))} {balances.currency}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          Positive balance means the group owes them, negative means they owe
          the group.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-xl font-semibold">Suggested Reimbursements</h3>
        {balances.suggestedReimbursements.length === 0 ? (
          <p className="">All settled up!</p>
        ) : (
          <ul className="space-y-2">
            {balances.suggestedReimbursements.map((r, index) => (
              <li
                key={index}
                className="border-light rounded-md border bg-blue-500/10 p-3 shadow-sm"
              >
                <span className="font-medium">{r.fromName}</span> should pay{' '}
                <span className="font-medium">{r.toName}</span>:
                <span className="text-primary ml-1 font-semibold">
                  {parseFloat(r.amount.toFixed(2))} {balances.currency}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
