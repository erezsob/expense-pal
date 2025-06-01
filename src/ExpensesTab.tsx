import { useMutation } from 'convex/react'
import { Id } from '../convex/_generated/dataModel'
import { EnrichedExpense } from '../convex/expenses'
import { api } from '../convex/_generated/api'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

interface ExpensesTabProps {
  groupId: Id<'groups'>
  expenses: EnrichedExpense[]
  currency: string
}

export function ExpensesTab({ groupId, expenses, currency }: ExpensesTabProps) {
  const addExpenseMutation = useMutation(api.expenses.addExpense)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      toast.error('Valid description and positive amount are required.')
      return
    }
    setIsLoading(true)
    try {
      await addExpenseMutation({
        groupId,
        description,
        amount: parseFloat(amount),
      })
      toast.success('Expense added!')
      setDescription('')
      setAmount('')
      setShowAddExpenseForm(false)
    } catch (error: any) {
      toast.error(`Failed to add expense: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}>
        {showAddExpenseForm ? 'Cancel' : 'Add New Expense'}
      </Button>

      {showAddExpenseForm && (
        <form onSubmit={handleAddExpense} className="card space-y-3">
          <h3 className="text-lg font-medium">New Expense</h3>
          <div>
            <label htmlFor="expDesc" className="mb-1 block text-sm font-medium">
              Description
            </label>
            <Input
              id="expDesc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner"
              className="input-field"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="expAmount"
              className="mb-1 block text-sm font-medium"
            >
              Amount ({currency})
            </label>
            <Input
              id="expAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 50.00"
              className="input-field"
              step="0.01"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading} variant="default">
            {isLoading ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      )}

      <h3 className="pt-2 text-xl font-semibold">Expense List</h3>
      {expenses.length === 0 ? (
        <p className="">No expenses recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {expenses.map((exp) => (
            <li
              key={exp._id}
              className="border-light bg-background rounded-md border p-3 shadow-sm sm:p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{exp.description}</p>
                  <p className="text-sm">Paid by: {exp.paidByName}</p>
                </div>
                <p className="text-lg font-semibold whitespace-nowrap">
                  {parseFloat(exp.amount.toFixed(2))} {currency}
                </p>
              </div>
              <p className="mt-1 text-xs">
                {new Date(Number(exp.date)).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
