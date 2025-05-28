import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Doc } from "../convex/_generated/dataModel";
import type { EnrichedExpense } from "../convex/expenses";
import type { EnrichedPayment } from "../convex/payments";
import type { GroupBalances } from "../convex/balances";

interface GroupViewProps {
  groupId: Id<"groups">;
  onBack: () => void;
}

export function GroupView({ groupId, onBack }: GroupViewProps) {
  const groupDetails = useQuery(api.groups.getGroupDetails, { groupId });
  const expenses = useQuery(api.expenses.getExpensesForGroup, { groupId });
  const payments = useQuery(api.payments.getPaymentsForGroup, { groupId });
  const balances = useQuery(api.balances.getGroupBalances, { groupId });
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const [activeTab, setActiveTab] = useState<
    "expenses" | "payments" | "members" | "balances" | "settings"
  >("expenses");

  if (
    groupDetails === undefined ||
    expenses === undefined ||
    payments === undefined ||
    balances === undefined ||
    loggedInUser === undefined
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!loggedInUser) {
    onBack(); // Should not happen if app flow is correct, but good for safety
    return null;
  }

  if (!groupDetails || balances === null) {
    toast.error("Group details or balances could not be loaded.");
    onBack();
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-error">
          Error loading group data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="btn btn-ghost mb-2 text-sm">
        &larr; Back to Groups
      </button>
      <header className="pb-4 border-b border-light">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          {groupDetails.name}
        </h1>
        <p className="text-on-surface-secondary">
          Currency: {groupDetails.currency}
        </p>
      </header>

      <div className="flex border-b border-light">
        {(
          ["expenses", "payments", "members", "balances", "settings"] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button capitalize ${
              activeTab === tab ? "tab-button-active" : "tab-button-inactive"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "expenses" && expenses && (
          <ExpensesTab
            groupId={groupId}
            expenses={expenses}
            members={
              groupDetails.members as { userId: Id<"users">; name: string }[]
            }
            currency={groupDetails.currency}
            loggedInUserId={loggedInUser._id}
          />
        )}
        {activeTab === "payments" && payments && (
          <PaymentsTab
            groupId={groupId}
            payments={payments}
            members={
              groupDetails.members as { userId: Id<"users">; name: string }[]
            }
            currency={groupDetails.currency}
            loggedInUserId={loggedInUser._id}
          />
        )}
        {activeTab === "members" && (
          <MembersTab
            groupId={groupId}
            members={
              groupDetails.members as {
                userId: Id<"users">;
                name: string;
                email?: string | null;
              }[]
            }
          />
        )}
        {activeTab === "balances" && balances && (
          <BalancesTab balances={balances} />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            groupDetails={
              groupDetails as Doc<"groups"> & {
                members: {
                  userId: Id<"users">;
                  name: string;
                  email?: string | null;
                }[];
              }
            }
          />
        )}
      </div>
    </div>
  );
}

// --- Expenses Tab ---
interface ExpensesTabProps {
  groupId: Id<"groups">;
  expenses: EnrichedExpense[];
  members: { userId: Id<"users">; name: string }[];
  currency: string;
  loggedInUserId: Id<"users">;
}
function ExpensesTab({
  groupId,
  expenses,
  members,
  currency,
  loggedInUserId,
}: ExpensesTabProps) {
  const addExpenseMutation = useMutation(api.expenses.addExpense);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      toast.error("Valid description and positive amount are required.");
      return;
    }
    setIsLoading(true);
    try {
      await addExpenseMutation({
        groupId,
        description,
        amount: parseFloat(amount),
      });
      toast.success("Expense added!");
      setDescription("");
      setAmount("");
      setShowAddExpenseForm(false);
    } catch (error: any) {
      toast.error(`Failed to add expense: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
        className={`btn ${showAddExpenseForm ? "btn-secondary" : "btn-success"}`}
      >
        {showAddExpenseForm ? "Cancel" : "Add New Expense"}
      </button>

      {showAddExpenseForm && (
        <form onSubmit={handleAddExpense} className="card space-y-3">
          <h3 className="text-lg font-medium text-on-surface">New Expense</h3>
          <div>
            <label
              htmlFor="expDesc"
              className="block text-sm font-medium text-on-surface-secondary mb-1"
            >
              Description
            </label>
            <input
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
              className="block text-sm font-medium text-on-surface-secondary mb-1"
            >
              Amount ({currency})
            </label>
            <input
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
          <button
            type="submit"
            className={`btn btn-primary ${isLoading ? "btn-disabled" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      )}

      <h3 className="text-xl font-semibold text-on-surface pt-2">
        Expense List
      </h3>
      {expenses.length === 0 ? (
        <p className="text-on-surface-secondary">No expenses recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {expenses.map((exp) => (
            <li
              key={exp._id}
              className="p-3 sm:p-4 border border-light rounded-md bg-background shadow-sm"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium text-on-surface">
                    {exp.description}
                  </p>
                  <p className="text-sm text-on-surface-secondary">
                    Paid by: {exp.paidByName}
                  </p>
                </div>
                <p className="font-semibold text-lg text-on-surface whitespace-nowrap">
                  {parseFloat(exp.amount.toFixed(2))} {currency}
                </p>
              </div>
              <p className="text-xs text-on-surface-secondary/80 mt-1">
                {new Date(Number(exp.date)).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Payments Tab ---
interface PaymentsTabProps {
  groupId: Id<"groups">;
  payments: EnrichedPayment[];
  members: { userId: Id<"users">; name: string }[];
  currency: string;
  loggedInUserId: Id<"users">;
}
function PaymentsTab({
  groupId,
  payments,
  members,
  currency,
  loggedInUserId,
}: PaymentsTabProps) {
  const recordPaymentMutation = useMutation(api.payments.recordPayment);
  const [payeeUserId, setPayeeUserId] = useState<Id<"users"> | "">("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!payeeUserId || !amount.trim() || parseFloat(amount) <= 0) {
      toast.error("Valid payee and positive amount are required.");
      return;
    }
    setIsLoading(true);
    try {
      await recordPaymentMutation({
        groupId,
        payeeUserId: payeeUserId as Id<"users">,
        amount: parseFloat(amount),
        notes: notes.trim() || undefined,
      });
      toast.success("Payment recorded!");
      setPayeeUserId("");
      setAmount("");
      setNotes("");
      setShowAddPaymentForm(false);
    } catch (error: any) {
      toast.error(`Failed to record payment: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const availablePayees = members.filter((m) => m.userId !== loggedInUserId);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAddPaymentForm(!showAddPaymentForm)}
        className={`btn ${showAddPaymentForm ? "btn-secondary" : "bg-accent text-accent-contrast hover:bg-accent-dark focus:ring-accent"}`}
      >
        {showAddPaymentForm ? "Cancel" : "Record New Payment"}
      </button>

      {showAddPaymentForm && (
        <form onSubmit={handleRecordPayment} className="card space-y-3">
          <h3 className="text-lg font-medium text-on-surface">
            Record Payment (I paid someone)
          </h3>
          <div>
            <label
              htmlFor="payee"
              className="block text-sm font-medium text-on-surface-secondary mb-1"
            >
              To (Payee)
            </label>
            <select
              id="payee"
              value={payeeUserId}
              onChange={(e) =>
                setPayeeUserId(e.target.value as Id<"users"> | "")
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
              <p className="text-xs text-error mt-1">
                No other members to pay.
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="paymentAmount"
              className="block text-sm font-medium text-on-surface-secondary mb-1"
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
              className="block text-sm font-medium text-on-surface-secondary mb-1"
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
            className={`btn btn-primary ${isLoading || !payeeUserId ? "btn-disabled" : ""}`}
            disabled={isLoading || !payeeUserId}
          >
            {isLoading ? "Recording..." : "Record Payment"}
          </button>
        </form>
      )}

      <h3 className="text-xl font-semibold text-on-surface pt-2">
        Payment History
      </h3>
      {payments.length === 0 ? (
        <p className="text-on-surface-secondary">No payments recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li
              key={p._id}
              className="p-3 sm:p-4 border border-light rounded-md bg-background shadow-sm"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium text-on-surface">
                    {p.payerName} &rarr; {p.payeeName}
                  </p>
                  {p.notes && (
                    <p className="text-sm text-on-surface-secondary">
                      Notes: {p.notes}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-lg text-on-surface whitespace-nowrap">
                  {parseFloat(p.amount.toFixed(2))} {currency}
                </p>
              </div>
              <p className="text-xs text-on-surface-secondary/80 mt-1">
                {new Date(Number(p.date)).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Members Tab ---
interface MembersTabProps {
  groupId: Id<"groups">;
  members: { userId: Id<"users">; name: string; email?: string | null }[];
}
function MembersTab({ groupId, members }: MembersTabProps) {
  const inviteUserMutation = useMutation(api.groups.inviteUserToGroup);
  const [emailToInvite, setEmailToInvite] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailToInvite.trim()) {
      toast.error("Email is required to invite a user.");
      return;
    }
    setIsInviting(true);
    try {
      await inviteUserMutation({ groupId, emailToInvite });
      toast.success(
        `Invitation sent to ${emailToInvite} (if they are a registered user).`,
      );
      setEmailToInvite("");
    } catch (error: any) {
      toast.error(`Failed to invite user: ${error.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleInviteUser} className="card space-y-3">
        <h3 className="text-lg font-medium text-on-surface">
          Invite New Member
        </h3>
        <div>
          <label
            htmlFor="inviteEmail"
            className="block text-sm font-medium text-on-surface-secondary mb-1"
          >
            User's Email
          </label>
          <input
            id="inviteEmail"
            type="email"
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            placeholder="user@example.com"
            className="input-field"
            disabled={isInviting}
          />
        </div>
        <button
          type="submit"
          className={`btn btn-primary ${isInviting ? "btn-disabled" : ""}`}
          disabled={isInviting}
        >
          {isInviting ? "Inviting..." : "Invite User"}
        </button>
      </form>

      <div>
        <h3 className="text-xl font-semibold text-on-surface mb-3">
          Current Members
        </h3>
        {members.length === 0 ? (
          <p className="text-on-surface-secondary">
            No members in this group yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.userId}
                className="p-3 border border-light rounded-md bg-background shadow-sm"
              >
                <p className="font-medium text-on-surface">{member.name}</p>
                {member.email && (
                  <p className="text-sm text-on-surface-secondary">
                    {member.email}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Balances Tab ---
interface BalancesTabProps {
  balances: GroupBalances;
}
function BalancesTab({ balances }: BalancesTabProps) {
  if (!balances) {
    return <p className="text-on-surface-secondary">Loading balances...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-on-surface mb-3">
          Member Balances
        </h3>
        <ul className="space-y-2">
          {balances.members.map((member) => (
            <li
              key={member.userId}
              className={`p-3 border rounded-md shadow-sm flex justify-between items-center ${member.balance >= -0.001 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}
            >
              <span className="font-medium text-on-surface">{member.name}</span>
              <span
                className={`font-semibold ${member.balance >= -0.001 ? "text-success" : "text-error"}`}
              >
                {member.balance >= -0.001 ? "+" : ""}
                {parseFloat(member.balance.toFixed(2))} {balances.currency}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-on-surface-secondary mt-2">
          Positive balance means the group owes them, negative means they owe
          the group.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-on-surface mb-3">
          Suggested Reimbursements
        </h3>
        {balances.suggestedReimbursements.length === 0 ? (
          <p className="text-on-surface-secondary">All settled up!</p>
        ) : (
          <ul className="space-y-2">
            {balances.suggestedReimbursements.map((r, index) => (
              <li
                key={index}
                className="p-3 border border-light rounded-md bg-blue-500/10 shadow-sm"
              >
                <span className="font-medium text-on-surface">
                  {r.fromName}
                </span>{" "}
                should pay{" "}
                <span className="font-medium text-on-surface">{r.toName}</span>:
                <span className="font-semibold ml-1 text-primary">
                  {parseFloat(r.amount.toFixed(2))} {balances.currency}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Settings Tab ---
interface SettingsTabProps {
  groupDetails: Doc<"groups"> & {
    members: { userId: Id<"users">; name: string; email?: string | null }[];
  };
}

function SettingsTab({ groupDetails }: SettingsTabProps) {
  const updateSettingsMutation = useMutation(api.groups.updateGroupSettings);
  const [name, setName] = useState(groupDetails.name);
  const [currency, setCurrency] = useState(groupDetails.currency);
  const [splitType, setSplitType] = useState<"EQUAL" | "PERCENTAGES">(
    groupDetails.defaultSplitRatio.type,
  );

  const initialPercentages =
    groupDetails.defaultSplitRatio.type === "PERCENTAGES" &&
    groupDetails.defaultSplitRatio.percentages
      ? groupDetails.defaultSplitRatio.percentages.map((p) => ({
          userId: p.userId,
          share: p.share * 100,
        }))
      : groupDetails.members.map((m) => ({
          userId: m.userId,
          share:
            splitType === "EQUAL" && groupDetails.members.length > 0
              ? 100 / groupDetails.members.length
              : 0,
        }));

  const [percentages, setPercentages] =
    useState<{ userId: Id<"users">; share: number }[]>(initialPercentages);
  const [isLoading, setIsLoading] = useState(false);

  const handlePercentageChange = (userId: Id<"users">, value: string) => {
    const newShare = parseFloat(value);
    if (isNaN(newShare) && value !== "" && value !== "-") return;

    setPercentages(
      (prev) =>
        prev.map((p) =>
          p.userId === userId
            ? {
                ...p,
                share: isNaN(newShare) ? (value === "-" ? 0 : 0) : newShare,
              }
            : p,
        ), // Allow typing '-', treat as 0 for now
    );
  };

  const rebalancePercentages = () => {
    if (splitType !== "PERCENTAGES" || percentages.length === 0) return;
    const totalMembers = percentages.length;
    const equalShare =
      totalMembers > 0 ? parseFloat((100 / totalMembers).toFixed(2)) : 0; // Ensure precision

    let updatedPercentages = percentages.map((p) => ({
      ...p,
      share: equalShare,
    }));

    // Adjust last member's share to ensure total is exactly 100 due to floating point issues
    const currentTotal = updatedPercentages.reduce(
      (sum, p) => sum + p.share,
      0,
    );
    if (totalMembers > 0 && Math.abs(currentTotal - 100) > 0.001) {
      const difference = 100 - currentTotal;
      updatedPercentages[totalMembers - 1].share += difference;
      updatedPercentages[totalMembers - 1].share = parseFloat(
        updatedPercentages[totalMembers - 1].share.toFixed(2),
      );
    }
    setPercentages(updatedPercentages);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currency.trim()) {
      toast.error("Group name and currency are required.");
      return;
    }

    let splitRatioPayload:
      | { type: "EQUAL" }
      | {
          type: "PERCENTAGES";
          percentages: { userId: Id<"users">; share: number }[];
        };

    if (splitType === "EQUAL") {
      splitRatioPayload = { type: "EQUAL" };
    } else {
      const totalPercentage = percentages.reduce(
        (sum, p) => sum + (Number(p.share) || 0),
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.1) {
        toast.error(
          `Total percentages must sum to 100%. Current sum: ${totalPercentage.toFixed(2)}%`,
        );
        return;
      }
      if (percentages.some((p) => (Number(p.share) || 0) < 0)) {
        toast.error("Percentages cannot be negative.");
        return;
      }
      splitRatioPayload = {
        type: "PERCENTAGES",
        percentages: percentages.map((p) => ({
          userId: p.userId,
          share: (Number(p.share) || 0) / 100,
        })),
      };
    }

    setIsLoading(true);
    try {
      await updateSettingsMutation({
        groupId: groupDetails._id,
        name,
        currency,
        defaultSplitRatio: splitRatioPayload,
      });
      toast.success("Group settings updated!");
    } catch (error: any) {
      toast.error(`Failed to update settings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <h3 className="text-xl font-semibold text-on-surface">Group Settings</h3>
      <div>
        <label
          htmlFor="groupNameSet"
          className="block text-sm font-medium text-on-surface-secondary mb-1"
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
        <label
          htmlFor="currencySet"
          className="block text-sm font-medium text-on-surface-secondary mb-1"
        >
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
        <label className="block text-sm font-medium text-on-surface-secondary mb-1">
          Default Expense Split Ratio
        </label>
        <div className="mt-1 flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="splitType"
              value="EQUAL"
              checked={splitType === "EQUAL"}
              onChange={() => setSplitType("EQUAL")}
              className="form-radio text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <span className="ml-2 text-on-surface">Equal Split</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="splitType"
              value="PERCENTAGES"
              checked={splitType === "PERCENTAGES"}
              onChange={() => setSplitType("PERCENTAGES")}
              className="form-radio text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <span className="ml-2 text-on-surface">By Percentages</span>
          </label>
        </div>
      </div>

      {splitType === "PERCENTAGES" && (
        <div className="space-y-3 p-3 border border-light rounded-md bg-background">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-on-surface">
              Define Percentages (must sum to 100%)
            </h4>
            <button
              type="button"
              onClick={rebalancePercentages}
              className="btn btn-secondary text-xs px-2 py-1"
              disabled={isLoading || groupDetails.members.length === 0}
            >
              Distribute Equally
            </button>
          </div>
          {percentages.map((p) => {
            const member = groupDetails.members.find(
              (m) => m.userId === p.userId,
            );
            return (
              <div key={p.userId} className="flex items-center space-x-2">
                <label
                  htmlFor={`percentage-${p.userId}`}
                  className="w-1/2 text-sm truncate text-on-surface-secondary"
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
                <span className="text-sm text-on-surface-secondary">%</span>
              </div>
            );
          })}
          <p className="text-sm font-medium text-on-surface">
            Total:{" "}
            {percentages
              .reduce((sum, p) => sum + (Number(p.share) || 0), 0)
              .toFixed(2)}
            %
          </p>
        </div>
      )}

      <button
        type="submit"
        className={`btn btn-primary ${isLoading ? "btn-disabled" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
