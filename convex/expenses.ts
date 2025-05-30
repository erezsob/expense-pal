import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'
import { Doc, Id } from './_generated/dataModel'

// Define the expected return type for enriched expenses
export type EnrichedExpense = Doc<'expenses'> & { paidByName: string }

export const addExpense = mutation({
  args: {
    groupId: v.id('groups'),
    description: v.string(),
    amount: v.number(),
    date: v.optional(v.int64()),
    splitConfig: v.optional(
      v.object({
        type: v.union(
          v.literal('EQUAL'),
          v.literal('PERCENTAGES'),
          v.literal('FIXED_AMOUNTS'),
        ),
        shares: v.array(
          v.object({
            userId: v.id('users'),
            value: v.number(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const membership = await ctx.db
      .query('groupMembers')
      .withIndex('by_groupId_and_userId', (q) =>
        q.eq('groupId', args.groupId).eq('userId', userId),
      )
      .unique()

    if (!membership) {
      throw new Error('User is not a member of this group.')
    }

    if (args.amount <= 0) {
      throw new Error('Expense amount must be positive.')
    }

    if (args.splitConfig) {
      const groupMembers = await ctx.db
        .query('groupMembers')
        .withIndex('by_groupId', (q) => q.eq('groupId', args.groupId))
        .collect()
      const groupMemberIds = groupMembers.map((gm) => gm.userId)

      for (const share of args.splitConfig.shares) {
        if (!groupMemberIds.some((id) => id === share.userId)) {
          throw new Error(
            `User ${share.userId} in split configuration is not a member of the group.`,
          )
        }
      }

      if (args.splitConfig.type === 'PERCENTAGES') {
        const totalPercentage = args.splitConfig.shares.reduce(
          (sum, s) => sum + s.value,
          0,
        )
        if (Math.abs(totalPercentage - 1.0) > 0.001) {
          throw new Error('Total percentage shares must sum to 1.0 (or 100%).')
        }
      } else if (args.splitConfig.type === 'FIXED_AMOUNTS') {
        const totalFixedAmount = args.splitConfig.shares.reduce(
          (sum, s) => sum + s.value,
          0,
        )
        if (Math.abs(totalFixedAmount - args.amount) > 0.001) {
          throw new Error('Total fixed amounts must sum to the expense amount.')
        }
      }
    }

    const expenseId = await ctx.db.insert('expenses', {
      groupId: args.groupId,
      description: args.description,
      amount: args.amount,
      paidByUserId: userId,
      date: args.date ?? BigInt(Date.now()),
      splitConfig: args.splitConfig,
    })

    return expenseId
  },
})

export const getExpensesForGroup = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args): Promise<EnrichedExpense[]> => {
    // Explicit return type
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const membership = await ctx.db
      .query('groupMembers')
      .withIndex('by_groupId_and_userId', (q) =>
        q.eq('groupId', args.groupId).eq('userId', userId),
      )
      .unique()

    if (!membership) {
      throw new Error('User not authorized to view expenses for this group.')
    }

    const expenses = await ctx.db
      .query('expenses')
      .withIndex('by_groupId', (q) => q.eq('groupId', args.groupId))
      .order('desc')
      .collect()

    const enrichedExpenses: EnrichedExpense[] = await Promise.all(
      expenses.map(async (expense) => {
        const payer = await ctx.db.get(expense.paidByUserId)
        return {
          ...expense,
          paidByName: payer?.name ?? payer?.email ?? 'Unknown User',
        }
      }),
    )
    return enrichedExpenses
  },
})
