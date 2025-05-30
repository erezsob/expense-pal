import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'
import { Id } from './_generated/dataModel'

export const createGroup = mutation({
  args: {
    name: v.string(),
    currency: v.string(), // e.g., "USD"
    // Initial members (creator is automatically added)
    // For simplicity, we'll just add the creator for now.
    // Inviting others will be a separate step.
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const groupId = await ctx.db.insert('groups', {
      name: args.name,
      currency: args.currency,
      defaultSplitRatio: { type: 'EQUAL' as const }, // Default to equal split
      createdByUser: userId,
    })

    // Add the creator as a member of the group
    await ctx.db.insert('groupMembers', {
      groupId: groupId,
      userId: userId,
    })

    return groupId
  },
})

export const getGroupsForUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const userGroupMemberships = await ctx.db
      .query('groupMembers')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()

    const groupIds = userGroupMemberships.map((gm) => gm.groupId)

    const groups = await Promise.all(
      groupIds.map((groupId) => ctx.db.get(groupId)),
    )

    return groups.filter((g) => g !== null)
  },
})

export const getGroupDetails = query({
  args: {
    groupId: v.id('groups'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const group = await ctx.db.get(args.groupId)
    if (!group) {
      throw new Error('Group not found')
    }

    // Check if user is a member of the group
    const membership = await ctx.db
      .query('groupMembers')
      .withIndex('by_groupId_and_userId', (q) =>
        q.eq('groupId', args.groupId).eq('userId', userId),
      )
      .unique()

    if (!membership) {
      throw new Error('User not authorized to view this group')
    }

    const membersEntries = await ctx.db
      .query('groupMembers')
      .withIndex('by_groupId', (q) => q.eq('groupId', args.groupId))
      .collect()

    const memberUserDetails = await Promise.all(
      membersEntries.map(async (memberEntry) => {
        const user = await ctx.db.get(memberEntry.userId)
        return {
          userId: memberEntry.userId,
          name: user?.name ?? user?.email ?? 'Unknown User',
          email: user?.email,
          _id: user?._id,
          _creationTime: user?._creationTime,
        }
      }),
    )

    return {
      ...group,
      members: memberUserDetails,
    }
  },
})

export const inviteUserToGroup = mutation({
  args: {
    groupId: v.id('groups'),
    emailToInvite: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx)
    if (!currentUserId) {
      throw new Error('User not authenticated')
    }

    const group = await ctx.db.get(args.groupId)
    if (!group) {
      throw new Error('Group not found')
    }
    // Optional: Check if currentUserId is an admin or creator of the group
    // if (group.createdByUser !== currentUserId) {
    //   throw new Error("Only the group creator can invite users for now.");
    // }

    const userToInvite = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', args.emailToInvite))
      .unique()

    if (!userToInvite) {
      // For now, we'll require the user to exist.
      // Later, we could implement an invitation system for non-existing users.
      throw new Error(`User with email ${args.emailToInvite} not found.`)
    }

    const existingMembership = await ctx.db
      .query('groupMembers')
      .withIndex('by_groupId_and_userId', (q) =>
        q.eq('groupId', args.groupId).eq('userId', userToInvite._id),
      )
      .unique()

    if (existingMembership) {
      throw new Error(`User ${args.emailToInvite} is already in the group.`)
    }

    await ctx.db.insert('groupMembers', {
      groupId: args.groupId,
      userId: userToInvite._id,
    })

    return { success: true }
  },
})

export const updateGroupSettings = mutation({
  args: {
    groupId: v.id('groups'),
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
    defaultSplitRatio: v.optional(
      v.object({
        type: v.union(v.literal('EQUAL'), v.literal('PERCENTAGES')),
        percentages: v.optional(
          v.array(v.object({ userId: v.id('users'), share: v.number() })),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const group = await ctx.db.get(args.groupId)
    if (!group) {
      throw new Error('Group not found')
    }

    // Optional: Add permission check (e.g., only creator or admin can update)
    if (group.createdByUser !== userId) {
      const member = await ctx.db
        .query('groupMembers')
        .withIndex('by_groupId_and_userId', (q) =>
          q.eq('groupId', args.groupId).eq('userId', userId),
        )
        .unique()
      // Add role check here if roles are implemented, e.g. member.role === "admin"
      if (!member) {
        // Basic check: must be a member
        throw new Error("User not authorized to update this group's settings.")
      }
    }

    const { groupId, ...updates } = args

    if (updates.defaultSplitRatio?.type === 'PERCENTAGES') {
      if (
        !updates.defaultSplitRatio.percentages ||
        updates.defaultSplitRatio.percentages.length === 0
      ) {
        throw new Error(
          'Percentages must be provided for PERCENTAGES split type.',
        )
      }
      const totalShare = updates.defaultSplitRatio.percentages.reduce(
        (sum, p) => sum + p.share,
        0,
      )
      // Allowing for small floating point inaccuracies
      if (Math.abs(totalShare - 1.0) > 0.001) {
        throw new Error('Total percentage shares must sum up to 1 (or 100%).')
      }
    }

    await ctx.db.patch(args.groupId, updates)
    return { success: true }
  },
})
