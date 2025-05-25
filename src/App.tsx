import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { CreateGroupForm } from "./CreateGroupForm";
import { GroupList } from "./GroupList";
import { useState } from "react";
import { GroupView } from "./GroupView";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-light px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-primary">SplitEase</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div className="flex flex-col items-center gap-8 mt-12 text-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">Welcome to SplitEase</h1>
          <p className="text-lg sm:text-xl text-on-surface-secondary">Sign in to manage your shared expenses effortlessly.</p>
        </div>
        <div className="w-full max-w-sm card">
          <SignInForm />
        </div>
      </div>
    );
  }

  if (selectedGroupId) {
    return <GroupView groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1">Your Groups</h1>
        <p className="text-md sm:text-lg text-on-surface-secondary">
          Welcome back, <span className="font-medium text-primary">{loggedInUser?.name ?? loggedInUser?.email}!</span>
        </p>
      </div>
      
      <div className="card">
        <h2 className="text-xl sm:text-2xl font-semibold text-on-surface mb-4">Create a New Group</h2>
        <CreateGroupForm onSuccess={(groupId) => {
          toast.success("Group created successfully!");
          setSelectedGroupId(groupId);
        }} />
      </div>

      <div className="card">
        <h2 className="text-xl sm:text-2xl font-semibold text-on-surface mb-4">Existing Groups</h2>
        <GroupList onSelectGroup={setSelectedGroupId} />
      </div>
    </div>
  );
}
