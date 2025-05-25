import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

// Define the structure for individual member balances
export type MemberBalance = {
  userId: Id<"users">;
  name: string;
  balance: number;
};

// Define the structure for suggested reimbursements
export type Reimbursement = {
  from: Id<"users">;
  fromName: string;
  to: Id<"users">;
  toName: string;
  amount: number;
};

// Define the overall return type for the getGroupBalances query
export type GroupBalances = {
  currency: string;
  members: MemberBalance[];
  suggestedReimbursements: Reimbursement[];
};


// Helper function to calculate each member's share of an expense
function calculateExpenseShares(
  expense: Doc<"expenses">,
  groupMembers: Doc<"groupMembers">[],
  group: Doc<"groups">
): Map<Id<"users">, number> {
  const shares = new Map<Id<"users">, number>();
  const memberIds = groupMembers.map(gm => gm.userId);

  const effectiveSplitConfig = expense.splitConfig ?? group.defaultSplitRatio;

  switch (effectiveSplitConfig.type) {
    case "EQUAL":
      const equalShare = expense.amount / memberIds.length;
      memberIds.forEach(userId => shares.set(userId, equalShare));
      break;
    case "PERCENTAGES":
      if (expense.splitConfig && expense.splitConfig.type === "PERCENTAGES") {
        const validSplitUsers = expense.splitConfig.shares.filter(s => memberIds.some(id => id === s.userId));
        validSplitUsers.forEach(share => {
          shares.set(share.userId, expense.amount * share.value);
        });
      } 
      else if (group.defaultSplitRatio.type === "PERCENTAGES" && group.defaultSplitRatio.percentages) {
        const validSplitUsers = group.defaultSplitRatio.percentages.filter(s => memberIds.some(id => id === s.userId));
        validSplitUsers.forEach(share => {
          shares.set(share.userId, expense.amount * share.share);
        });
      } else {
        console.warn(`Percentages not defined correctly for expense ${expense._id}, falling back to EQUAL split.`);
        const fallbackEqualShare = expense.amount / memberIds.length;
        memberIds.forEach(userId => shares.set(userId, fallbackEqualShare));
      }
      memberIds.forEach(userId => {
        if (!shares.has(userId)) {
          shares.set(userId, 0);
        }
      });
      break;
    case "FIXED_AMOUNTS": 
      if (!expense.splitConfig || expense.splitConfig.type !== "FIXED_AMOUNTS") {
        console.warn(`FIXED_AMOUNTS split called without proper config for expense ${expense._id}, falling back to EQUAL split.`);
        const fallbackShare = expense.amount / memberIds.length;
        memberIds.forEach(userId => shares.set(userId, fallbackShare));
        break;
      }
      expense.splitConfig.shares.forEach(share => {
         if (memberIds.some(id => id === share.userId)) { 
            shares.set(share.userId, share.value);
         }
      });
      memberIds.forEach(userId => {
        if (!shares.has(userId)) {
          shares.set(userId, 0);
        }
      });
      break;
    default: 
      const defaultShare = expense.amount / memberIds.length;
      memberIds.forEach(userId => shares.set(userId, defaultShare));
  }
  return shares;
}

export const getGroupBalances = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args): Promise<GroupBalances | null> => { // Explicit return type
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      // Return null or throw error based on how frontend should handle non-existent group
      return null; 
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId_and_userId", (q) =>
        q.eq("groupId", args.groupId).eq("userId", currentUserId)
      )
      .unique();

    if (!membership) {
      throw new Error("User not authorized to view balances for this group.");
    }

    const groupMembers = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    
    const memberUserDetails = await Promise.all(
        groupMembers.map(async (member) => {
            const userDoc = await ctx.db.get(member.userId);
            return {
                userId: member.userId,
                name: userDoc?.name ?? userDoc?.email ?? "Unknown User",
            };
        })
    );

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const balancesMap = new Map<Id<"users">, number>();
    groupMembers.forEach(member => balancesMap.set(member.userId, 0));

    expenses.forEach(expense => {
      const currentPaid = balancesMap.get(expense.paidByUserId) ?? 0;
      balancesMap.set(expense.paidByUserId, currentPaid + expense.amount);
    });

    expenses.forEach(expense => {
      const shares = calculateExpenseShares(expense, groupMembers, group);
      shares.forEach((shareAmount, userId) => {
        const currentBalance = balancesMap.get(userId) ?? 0;
        balancesMap.set(userId, currentBalance - shareAmount);
      });
    });

    payments.forEach(payment => {
      const payerBalance = balancesMap.get(payment.payerUserId) ?? 0;
      balancesMap.set(payment.payerUserId, payerBalance - payment.amount);

      const payeeBalance = balancesMap.get(payment.payeeUserId) ?? 0;
      balancesMap.set(payment.payeeUserId, payeeBalance + payment.amount);
    });
    
    const memberBalancesResult: MemberBalance[] = memberUserDetails.map(member => ({
        userId: member.userId,
        name: member.name,
        balance: balancesMap.get(member.userId) ?? 0,
    }));

    let debtors = memberBalancesResult.filter(m => m.balance < -0.001); 
    let creditors = memberBalancesResult.filter(m => m.balance > 0.001);
    debtors.sort((a, b) => a.balance - b.balance); 
    creditors.sort((a, b) => b.balance - a.balance); 

    const reimbursementsResult: Reimbursement[] = [];

    let mutableDebtors = debtors.map(d => ({ ...d }));
    let mutableCreditors = creditors.map(c => ({ ...c }));

    while (mutableDebtors.length > 0 && mutableCreditors.length > 0) {
        const debtor = mutableDebtors[0];
        const creditor = mutableCreditors[0];
        const amountToTransfer = Math.min(-debtor.balance, creditor.balance);

        reimbursementsResult.push({
            from: debtor.userId,
            fromName: debtor.name,
            to: creditor.userId,
            toName: creditor.name,
            amount: amountToTransfer,
        });

        debtor.balance += amountToTransfer;
        creditor.balance -= amountToTransfer;

        if (Math.abs(debtor.balance) < 0.001) mutableDebtors.shift();
        if (Math.abs(creditor.balance) < 0.001) mutableCreditors.shift();
    }

    return {
      currency: group.currency,
      members: memberBalancesResult,
      suggestedReimbursements: reimbursementsResult,
    };
  },
});
