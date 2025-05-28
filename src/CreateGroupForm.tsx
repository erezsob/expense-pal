import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

interface CreateGroupFormProps {
  onSuccess: (groupId: Id<"groups">) => void;
}

export function CreateGroupForm({ onSuccess }: CreateGroupFormProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const createGroup = useMutation(api.groups.createGroup);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currency.trim()) {
      toast.error("Group name and currency are required.");
      return;
    }
    setIsLoading(true);
    try {
      const groupId = await createGroup({ name, currency });
      setName("");
      setCurrency("USD");
      onSuccess(groupId);
    } catch (error: any) {
      toast.error(
        `Failed to create group: ${error.message || error.toString()}`,
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="groupName"
          className="block text-sm font-medium text-on-surface-secondary mb-1"
        >
          Group Name
        </label>
        <input
          type="text"
          id="groupName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="e.g., Trip to Bali"
          disabled={isLoading}
        />
      </div>
      <div>
        <label
          htmlFor="currency"
          className="block text-sm font-medium text-on-surface-secondary mb-1"
        >
          Currency
        </label>
        <input
          type="text"
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          className="input-field"
          placeholder="e.g., USD, EUR, JPY"
          maxLength={3}
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        className={`btn btn-primary w-full ${isLoading ? "btn-disabled" : ""}`}
        disabled={isLoading || !name.trim() || !currency.trim()}
      >
        {isLoading ? "Creating..." : "Create Group"}
      </button>
    </form>
  );
}
