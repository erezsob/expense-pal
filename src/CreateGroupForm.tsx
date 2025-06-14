import { FormEvent, useState } from 'react';
import { api } from '../convex/_generated/api';
import { toast } from 'sonner';
import { Id } from '../convex/_generated/dataModel';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Text } from './components/ui/text';
import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';

interface CreateGroupFormProps {
  onSuccess: (groupId: Id<'groups'>) => void;
}

export function CreateGroupForm({ onSuccess }: CreateGroupFormProps) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const { mutate: createGroup } = useMutation({
    mutationFn: useConvexMutation(api.groups.createGroup),
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currency.trim()) {
      toast.error('Group name and currency are required.');
      return;
    }
    setIsLoading(true);

    createGroup(
      { name, currency },
      {
        onSuccess: (groupId) => {
          setName('');
          setCurrency('USD');
          onSuccess(groupId);
          setIsLoading(false);
        },
        onError: (error: unknown) => {
          if (error instanceof Error) {
            toast.error(
              `Failed to create group: ${error.message || error.toString()}`,
            );
            console.error(error);
          }
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <Text className="font-medium">Group Name</Text>
        <Input
          type="text"
          id="groupName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Trip to Bali"
          disabled={isLoading}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Text className="font-medium">Currency</Text>
        <Input
          type="text"
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          placeholder="e.g., USD, EUR, JPY"
          maxLength={3}
          disabled={isLoading}
          className="w-full"
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !name.trim() || !currency.trim()}
        className="w-full"
      >
        {isLoading ? 'Creating...' : 'Create Group'}
      </Button>
    </form>
  );
}
