import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

// Define the expected return type for enriched payments
export type EnrichedPayment = Doc<"payments"> & {
  payerName: string;
  payeeName: string;
};

export const recordPayment = mutation({
  args: {
    groupId: v.id("groups"),
    payeeUserId: v.id("users"),
    amount: v.number(),
    date: v.optional(v.int64()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payerUserId = await getAuthUserId(ctx);
    if (!payerUserId) {
      throw new Error("User not authenticated");
    }

    if (payerUserId === args.payeeUserId) {
      throw new Error("Payer and payee cannot be the same person.");
    }

    if (args.amount <= 0) {
      throw new Error("Payment amount must be positive.");
    }

    const payerMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId_and_userId", (q) =>
        q.eq("groupId", args.groupId).eq("userId", payerUserId),
      )
      .unique();

    const payeeMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId_and_userId", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.payeeUserId),
      )
      .unique();

    if (!payerMembership || !payeeMembership) {
      throw new Error("Both payer and payee must be members of this group.");
    }

    const paymentId = await ctx.db.insert("payments", {
      groupId: args.groupId,
      payerUserId: payerUserId,
      payeeUserId: args.payeeUserId,
      amount: args.amount,
      date: args.date ?? BigInt(Date.now()),
      notes: args.notes,
    });

    return paymentId;
  },
});

export const getPaymentsForGroup = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args): Promise<EnrichedPayment[]> => {
    // Explicit return type
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId_and_userId", (q) =>
        q.eq("groupId", args.groupId).eq("userId", userId),
      )
      .unique();

    if (!membership) {
      throw new Error("User not authorized to view payments for this group.");
    }

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();

    const enrichedPayments: EnrichedPayment[] = await Promise.all(
      payments.map(async (payment) => {
        const payer = await ctx.db.get(payment.payerUserId);
        const payee = await ctx.db.get(payment.payeeUserId);
        return {
          ...payment,
          payerName: payer?.name ?? payer?.email ?? "Unknown User",
          payeeName: payee?.name ?? payee?.email ?? "Unknown User",
        };
      }),
    );
    return enrichedPayments;
  },
});
