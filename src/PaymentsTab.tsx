import { FormEvent } from 'react'
import { Id } from '../convex/_generated/dataModel'
import { EnrichedPayment } from '../convex/payments'
import { api } from '../convex/_generated/api'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './components/ui/button'
import { Text } from './components/ui/text'
import { Input } from './components/ui/input'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

interface PaymentsTabProps {
  groupId: Id<'groups'>
  payments: EnrichedPayment[]
  members: { userId: Id<'users'>; name: string }[]
  currency: string
  loggedInUserId: Id<'users'>
}

export function PaymentsTab({
  groupId,
  payments,
  members,
  currency,
  loggedInUserId,
}: PaymentsTabProps) {
  const { mutate: recordPayment } = useMutation({
    mutationFn: useConvexMutation(api.payments.recordPayment),
  })
  const [payeeUserId, setPayeeUserId] = useState<Id<'users'> | ''>('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!payeeUserId || !amount.trim() || parseFloat(amount) <= 0) {
      toast.error('Valid payee and positive amount are required.')
      return
    }
    setIsLoading(true)
    recordPayment(
      {
        groupId,
        payeeUserId: payeeUserId as Id<'users'>,
        amount: parseFloat(amount),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded!')
          setPayeeUserId('')
          setAmount('')
          setNotes('')
          setShowAddPaymentForm(false)
          setIsLoading(false)
        },
        onError: (error: unknown) => {
          if (error instanceof Error) {
            toast.error(`Failed to record payment: ${error.message}`)
          }
          setIsLoading(false)
        },
      },
    )
  }

  const availablePayees = members.filter((m) => m.userId !== loggedInUserId)

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}
        variant={showAddPaymentForm ? 'secondary' : 'default'}
      >
        {showAddPaymentForm ? 'Cancel' : 'Record New Payment'}
      </Button>

      {showAddPaymentForm && (
        <form
          onSubmit={handleRecordPayment}
          className="mx-auto w-full max-w-md space-y-5"
        >
          <div>
            <Text className="mb-1 text-lg font-semibold">Record Payment</Text>
            <Text variant="muted" className="mb-2 text-sm">
              Log a payment you made to another group member.
            </Text>
          </div>
          <div className="space-y-2">
            <Text className="font-medium">To (Payee)</Text>
            <select
              id="payee"
              value={payeeUserId}
              onChange={(e) =>
                setPayeeUserId(e.target.value as Id<'users'> | '')
              }
              className="input-field w-full"
              disabled={isLoading || availablePayees.length === 0}
            >
              <option value="">Select Member</option>
              {availablePayees.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
            {availablePayees.length === 0 && (
              <Text variant="muted" className="text-error mt-1 text-xs">
                No other members to pay.
              </Text>
            )}
          </div>
          <div className="space-y-2">
            <Text className="font-medium">Amount ({currency})</Text>
            <Input
              id="paymentAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 20.00"
              step="0.01"
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Text className="font-medium">Notes (Optional)</Text>
            <Input
              id="paymentNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., For lunch"
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !payeeUserId}
            className="w-full"
          >
            {isLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </form>
      )}

      <h3 className="pt-2 text-xl font-semibold">Payment History</h3>
      {payments.length === 0 ? (
        <p className="">No payments recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li
              key={p._id}
              className="border-light bg-background rounded-md border p-3 shadow-sm sm:p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {p.payerName} &rarr; {p.payeeName}
                  </p>
                  {p.notes && <p className="text-sm">Notes: {p.notes}</p>}
                </div>
                <p className="text-lg font-semibold whitespace-nowrap">
                  {parseFloat(p.amount.toFixed(2))} {currency}
                </p>
              </div>
              <p className="mt-1 text-xs">
                {new Date(Number(p.date)).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
