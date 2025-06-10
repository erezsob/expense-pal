import { GroupBalances } from '../convex/balances'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Text } from './components/ui/text'

interface BalancesTabProps {
  balances: GroupBalances | undefined
}

export function BalancesTab({ balances }: BalancesTabProps) {
  if (!balances) {
    return (
      <Card>
        <CardContent className="py-6">
          <Text variant="muted" className="text-center">
            Loading balances...
          </Text>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Member Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {balances.members.map((member) => (
              <div
                key={member.userId}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  member.balance >= -0.001
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-red-500/30 bg-red-500/10'
                }`}
              >
                <Text className="font-medium">{member.name}</Text>
                <Text
                  className={`font-semibold ${
                    member.balance >= -0.001 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {member.balance >= -0.001 ? '+' : ''}
                  {parseFloat(member.balance.toFixed(2))} {balances.currency}
                </Text>
              </div>
            ))}
          </div>
          <Text variant="muted" className="mt-4 text-sm">
            Positive balance means the group owes them, negative means they owe
            the group.
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Reimbursements</CardTitle>
        </CardHeader>
        <CardContent>
          {balances.suggestedReimbursements.length === 0 ? (
            <Text variant="muted" className="text-center">
              All settled up!
            </Text>
          ) : (
            <div className="grid gap-3">
              {balances.suggestedReimbursements.map((r, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-4"
                >
                  <div className="space-y-1">
                    <Text className="font-medium">{r.fromName}</Text>
                    <Text variant="muted" className="text-sm">
                      should pay {r.toName}
                    </Text>
                  </div>
                  <Text className="font-semibold text-blue-600">
                    {parseFloat(r.amount.toFixed(2))} {balances.currency}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
