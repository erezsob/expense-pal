import { FormEvent } from 'react'
import { useMutation } from 'convex/react'
import { Id } from '../convex/_generated/dataModel'
import { EnrichedPayment } from '../convex/payments'
import { api } from '../convex/_generated/api'
import { useState } from 'react'
import { toast } from 'sonner'

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
  const recordPaymentMutation = useMutation(api.payments.recordPayment)
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
    try {
      await recordPaymentMutation({
        groupId,
        payeeUserId: payeeUserId as Id<'users'>,
        amount: parseFloat(amount),
        notes: notes.trim() || undefined,
      })
      toast.success('Payment recorded!')
      setPayeeUserId('')
      setAmount('')
      setNotes('')
      setShowAddPaymentForm(false)
    } catch (error: any) {
      toast.error(`Failed to record payment: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const availablePayees = members.filter((m) => m.userId !== loggedInUserId)

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}
        className={`btn ${showAddPaymentForm ? 'btn-secondary' : 'bg-accent text-accent-contrast hover:bg-accent-dark focus:ring-accent'}`}
      >
        {showAddPaymentForm ? 'Cancel' : 'Record New Payment'}
      </button>

      {showAddPaymentForm && (
        <form onSubmit={handleRecordPayment} className="card space-y-3">
          <h3 className="text-lg font-medium">
            Record Payment (I paid someone)
          </h3>
          <div>
            <label htmlFor="payee" className="mb-1 block text-sm font-medium">
              To (Payee)
            </label>
            <select
              id="payee"
              value={payeeUserId}
              onChange={(e) =>
                setPayeeUserId(e.target.value as Id<'users'> | '')
              }
              className="input-field"
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
              <p className="text-error mt-1 text-xs">
                No other members to pay.
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="paymentAmount"
              className="mb-1 block text-sm font-medium"
            >
              Amount ({currency})
            </label>
            <input
              id="paymentAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 20.00"
              className="input-field"
              step="0.01"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="paymentNotes"
              className="mb-1 block text-sm font-medium"
            >
              Notes (Optional)
            </label>
            <input
              id="paymentNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., For lunch"
              className="input-field"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className={`btn btn-primary ${isLoading || !payeeUserId ? 'btn-disabled' : ''}`}
            disabled={isLoading || !payeeUserId}
          >
            {isLoading ? 'Recording...' : 'Record Payment'}
          </button>
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
