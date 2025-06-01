import { toast } from 'sonner'
import { FormEvent, useState } from 'react'

import { useMutation } from 'convex/react'
import { Id } from '../convex/_generated/dataModel'

import { Doc } from '../convex/_generated/dataModel'
import { api } from '../convex/_generated/api'

interface SettingsTabProps {
  groupDetails: Doc<'groups'> & {
    members: { userId: Id<'users'>; name: string; email?: string | null }[]
  }
}

export function SettingsTab({ groupDetails }: SettingsTabProps) {
  const updateSettingsMutation = useMutation(api.groups.updateGroupSettings)
  const [name, setName] = useState(groupDetails.name)
  const [currency, setCurrency] = useState(groupDetails.currency)
  const [splitType, setSplitType] = useState<'EQUAL' | 'PERCENTAGES'>(
    groupDetails.defaultSplitRatio.type,
  )

  const initialPercentages =
    groupDetails.defaultSplitRatio.type === 'PERCENTAGES' &&
    groupDetails.defaultSplitRatio.percentages
      ? groupDetails.defaultSplitRatio.percentages.map((p) => ({
          userId: p.userId,
          share: p.share * 100,
        }))
      : groupDetails.members.map((m) => ({
          userId: m.userId,
          share:
            splitType === 'EQUAL' && groupDetails.members.length > 0
              ? 100 / groupDetails.members.length
              : 0,
        }))

  const [percentages, setPercentages] =
    useState<{ userId: Id<'users'>; share: number }[]>(initialPercentages)
  const [isLoading, setIsLoading] = useState(false)

  const handlePercentageChange = (userId: Id<'users'>, value: string) => {
    const newShare = parseFloat(value)
    if (isNaN(newShare) && value !== '' && value !== '-') return

    setPercentages(
      (prev) =>
        prev.map((p) =>
          p.userId === userId
            ? {
                ...p,
                share: isNaN(newShare) ? (value === '-' ? 0 : 0) : newShare,
              }
            : p,
        ), // Allow typing '-', treat as 0 for now
    )
  }

  const rebalancePercentages = () => {
    if (splitType !== 'PERCENTAGES' || percentages.length === 0) return
    const totalMembers = percentages.length
    const equalShare =
      totalMembers > 0 ? parseFloat((100 / totalMembers).toFixed(2)) : 0 // Ensure precision

    let updatedPercentages = percentages.map((p) => ({
      ...p,
      share: equalShare,
    }))

    // Adjust last member's share to ensure total is exactly 100 due to floating point issues
    const currentTotal = updatedPercentages.reduce((sum, p) => sum + p.share, 0)
    if (totalMembers > 0 && Math.abs(currentTotal - 100) > 0.001) {
      const difference = 100 - currentTotal
      updatedPercentages[totalMembers - 1].share += difference
      updatedPercentages[totalMembers - 1].share = parseFloat(
        updatedPercentages[totalMembers - 1].share.toFixed(2),
      )
    }
    setPercentages(updatedPercentages)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !currency.trim()) {
      toast.error('Group name and currency are required.')
      return
    }

    let splitRatioPayload:
      | { type: 'EQUAL' }
      | {
          type: 'PERCENTAGES'
          percentages: { userId: Id<'users'>; share: number }[]
        }

    if (splitType === 'EQUAL') {
      splitRatioPayload = { type: 'EQUAL' }
    } else {
      const totalPercentage = percentages.reduce(
        (sum, p) => sum + (Number(p.share) || 0),
        0,
      )
      if (Math.abs(totalPercentage - 100) > 0.1) {
        toast.error(
          `Total percentages must sum to 100%. Current sum: ${totalPercentage.toFixed(2)}%`,
        )
        return
      }
      if (percentages.some((p) => (Number(p.share) || 0) < 0)) {
        toast.error('Percentages cannot be negative.')
        return
      }
      splitRatioPayload = {
        type: 'PERCENTAGES',
        percentages: percentages.map((p) => ({
          userId: p.userId,
          share: (Number(p.share) || 0) / 100,
        })),
      }
    }

    setIsLoading(true)
    try {
      await updateSettingsMutation({
        groupId: groupDetails._id,
        name,
        currency,
        defaultSplitRatio: splitRatioPayload,
      })
      toast.success('Group settings updated!')
    } catch (error: any) {
      toast.error(`Failed to update settings: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <h3 className="text-xl font-semibold">Group Settings</h3>
      <div>
        <label
          htmlFor="groupNameSet"
          className="mb-1 block text-sm font-medium"
        >
          Group Name
        </label>
        <input
          id="groupNameSet"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="currencySet" className="mb-1 block text-sm font-medium">
          Currency
        </label>
        <input
          id="currencySet"
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          className="input-field"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Default Expense Split Ratio
        </label>
        <div className="mt-1 flex space-x-4">
          <label className="flex cursor-pointer items-center">
            <input
              type="radio"
              name="splitType"
              value="EQUAL"
              checked={splitType === 'EQUAL'}
              onChange={() => setSplitType('EQUAL')}
              className="form-radio text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <span className="ml-2">Equal Split</span>
          </label>
          <label className="flex cursor-pointer items-center">
            <input
              type="radio"
              name="splitType"
              value="PERCENTAGES"
              checked={splitType === 'PERCENTAGES'}
              onChange={() => setSplitType('PERCENTAGES')}
              className="form-radio text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <span className="ml-2">By Percentages</span>
          </label>
        </div>
      </div>

      {splitType === 'PERCENTAGES' && (
        <div className="border-light bg-background space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">
              Define Percentages (must sum to 100%)
            </h4>
            <button
              type="button"
              onClick={rebalancePercentages}
              className="btn btn-secondary px-2 py-1 text-xs"
              disabled={isLoading || groupDetails.members.length === 0}
            >
              Distribute Equally
            </button>
          </div>
          {percentages.map((p) => {
            const member = groupDetails.members.find(
              (m) => m.userId === p.userId,
            )
            return (
              <div key={p.userId} className="flex items-center space-x-2">
                <label
                  htmlFor={`percentage-${p.userId}`}
                  className="w-1/2 truncate text-sm"
                  title={member?.name ?? p.userId}
                >
                  {member?.name ?? p.userId}
                </label>
                <input
                  id={`percentage-${p.userId}`}
                  type="number"
                  value={p.share} // Keep as string for input control if needed, or manage as number
                  onChange={(e) =>
                    handlePercentageChange(p.userId, e.target.value)
                  }
                  className="input-field w-1/2 p-1 text-sm"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 50"
                  disabled={isLoading}
                />
                <span className="text-sm">%</span>
              </div>
            )
          })}
          <p className="text-sm font-medium">
            Total:{' '}
            {percentages
              .reduce((sum, p) => sum + (Number(p.share) || 0), 0)
              .toFixed(2)}
            %
          </p>
        </div>
      )}

      <button
        type="submit"
        className={`btn btn-primary ${isLoading ? 'btn-disabled' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
