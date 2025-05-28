import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  groups: defineTable({
    name: v.string(),
    currency: v.string(), // e.g., "USD", "EUR"
    // Default split ratio for the group, e.g., "EQUAL", "50-50".
    // More complex splits could be { type: "PERCENTAGE", shares: [{ userId: Id<"users">, percentage: v.number() }] }
    // For now, let's use a simple string and assume "EQUAL" if not specified.
    defaultSplitRatio: v.object({
      type: v.union(v.literal("EQUAL"), v.literal("PERCENTAGES")),
      // percentages array will be used if type is "PERCENTAGES"
      // each object in percentages should have userId and share (e.g. 0.5 for 50%)
      percentages: v.optional(
        v.array(v.object({ userId: v.id("users"), share: v.number() })),
      ),
    }),
    createdByUser: v.id("users"),
  }),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    // role: v.union(v.literal("admin"), v.literal("member")), // Optional: for role-based access
  })
    .index("by_groupId", ["groupId"])
    .index("by_userId", ["userId"])
    .index("by_groupId_and_userId", ["groupId", "userId"]),

  expenses: defineTable({
    groupId: v.id("groups"),
    description: v.string(),
    amount: v.number(),
    paidByUserId: v.id("users"),
    date: v.int64(), // Store as timestamp
    // Optional: specific split for this expense, overriding group default
    splitConfig: v.optional(
      v.object({
        type: v.union(
          v.literal("EQUAL"),
          v.literal("PERCENTAGES"),
          v.literal("FIXED_AMOUNTS"),
        ),
        shares: v.array(
          v.object({
            userId: v.id("users"),
            // share will be percentage (0-1) or fixed amount depending on type
            value: v.number(),
          }),
        ),
      }),
    ),
  }).index("by_groupId", ["groupId"]),

  payments: defineTable({
    groupId: v.id("groups"),
    payerUserId: v.id("users"),
    payeeUserId: v.id("users"),
    amount: v.number(),
    date: v.int64(), // Store as timestamp
    notes: v.optional(v.string()),
  })
    .index("by_groupId", ["groupId"])
    .index("by_payerUserId", ["payerUserId", "groupId"])
    .index("by_payeeUserId", ["payeeUserId", "groupId"]),

  // No separate reimbursements table; this will be calculated.
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
