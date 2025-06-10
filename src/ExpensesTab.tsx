import { Id } from '../convex/_generated/dataModel'
import { EnrichedExpense } from '../convex/expenses'
import { api } from '../convex/_generated/api'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Text } from './components/ui/text'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'

interface ExpensesTabProps {
  groupId: Id<'groups'>
  expenses: EnrichedExpense[]
  currency: string
}

export function ExpensesTab({ groupId, expenses, currency }: ExpensesTabProps) {
  const { mutate: addExpense } = useMutation({
    mutationFn: useConvexMutation(api.expenses.addExpense),
  })
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
    addExpense(
      {
        groupId,
        description,
        amount: parseFloat(amount),
      },
      {
        onSuccess: () => {
          toast.success('Expense added!')
          setDescription('')
          setAmount('')
          setShowAddExpenseForm(false)
          setIsLoading(false)
        },
        onError: (error: unknown) => {
          if (error instanceof Error) {
            toast.error(`Failed to add expense: ${error.message}`)
          }
          setIsLoading(false)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text variant="large">Expenses</Text>
        <Button
          onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
          variant={showAddExpenseForm ? 'outline' : 'default'}
        >
          {showAddExpenseForm ? 'Cancel' : 'Add New Expense'}
        </Button>
      </div>

      {showAddExpenseForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-2">
                <Text className="font-medium">Description</Text>
                <Input
                  id="expDesc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Text className="font-medium">Amount ({currency})</Text>
                <Input
                  id="expAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 50.00"
                  step="0.01"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Adding...' : 'Add Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <Text variant="large">Expense List</Text>
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <Text variant="muted" className="text-center">
                No expenses recorded yet.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {expenses.map((exp) => (
              <Card key={exp._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Text className="font-medium">{exp.description}</Text>
                      <Text variant="muted" className="text-sm">
                        Paid by: {exp.paidByName}
                      </Text>
                    </div>
                    <Text className="text-lg font-semibold whitespace-nowrap">
                      {parseFloat(exp.amount.toFixed(2))} {currency}
                    </Text>
                  </div>
                  <Text variant="muted" className="mt-2 text-xs">
                    {new Date(Number(exp.date)).toLocaleDateString()}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
