import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { CreateGroupForm } from "./CreateGroupForm";
import { GroupList } from "./GroupList";
import { useNavigate } from "@tanstack/react-router";

export function Home() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">
          Your Groups
        </h1>
        <p className="text-md sm:text-lg text-on-surface-secondary">
          Welcome back,{" "}
          <span className="font-medium text-primary">
            {loggedInUser?.name ?? loggedInUser?.email}!
          </span>
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl sm:text-2xl font-semibold text-on-surface mb-4">
          Create a New Group
        </h2>
        <CreateGroupForm
          onSuccess={(groupId) => {
            toast.success("Group created successfully!");
            navigate({ to: `/groups/${groupId}` });
          }}
        />
      </div>

      <div className="card">
        <h2 className="text-xl sm:text-2xl font-semibold text-on-surface mb-4">
          Existing Groups
        </h2>
        <GroupList
          onSelectGroup={(groupId) => navigate({ to: `/groups/${groupId}` })}
        />
      </div>
    </div>
  );
}
