import { toast } from 'sonner';

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Id } from '../../convex/_generated/dataModel';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '../../convex/_generated/api';
import { Doc } from '../../convex/_generated/dataModel';

import { ExpensesTab } from '../ExpensesTab';
import { MembersTab } from '../MembersTab';
import { BalancesTab } from '../BalancesTab';
import { SettingsTab } from '../SettingsTab';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupView,
});

const TABS = ['expenses', 'members', 'balances', 'settings'] as const;

export function GroupView() {
  const { groupId: groupIdString } = Route.useParams();
  const groupId = groupIdString as Id<'groups'>;

  const { data: groupDetails, isLoading: isGroupDetailsLoading } = useQuery(
    convexQuery(api.groups.getGroupDetails, { groupId }),
  );

  const { data: expenses, isLoading: isExpensesLoading } = useQuery(
    convexQuery(api.expenses.getExpensesForGroup, { groupId }),
  );
  const { data: balances, isLoading: isBalancesLoading } = useQuery(
    convexQuery(api.balances.getGroupBalances, { groupId }),
  );
  const { data: loggedInUser, isLoading: isLoggedInUserLoading } = useQuery(
    convexQuery(api.auth.loggedInUser, {}),
  );

  const navigate = useNavigate();
  const handleBackClick = () => navigate({ to: '/' });

  if (
    isGroupDetailsLoading ||
    isExpensesLoading ||
    isBalancesLoading ||
    isLoggedInUserLoading
  ) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!groupDetails || balances === null || !loggedInUser) {
    toast.error('Group details or balances could not be loaded.');
    handleBackClick();
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-error">
          Error loading group data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <Button
          onClick={handleBackClick}
          variant="ghost"
          className="-ml-2 w-fit"
        >
          &larr; Back to Groups
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {groupDetails.name}
              </h1>
              <Text variant="muted">Currency: {groupDetails.currency}</Text>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="w-full">
            {TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="flex-1">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="expenses">
              <ExpensesTab
                groupId={groupId}
                expenses={expenses || []}
                currency={groupDetails.currency}
              />
            </TabsContent>
            <TabsContent value="members">
              <MembersTab
                groupId={groupId}
                members={
                  groupDetails.members as {
                    userId: Id<'users'>;
                    name: string;
                  }[]
                }
              />
            </TabsContent>
            <TabsContent value="balances">
              <BalancesTab balances={balances} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsTab
                groupDetails={
                  groupDetails as Doc<'groups'> & {
                    members: {
                      userId: Id<'users'>;
                      name: string;
                      email?: string | null;
                    }[];
                  }
                }
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
