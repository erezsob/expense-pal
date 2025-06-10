import { SignInForm } from '@/SignInForm';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: Login,
});

export function Login() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mt-12 flex flex-col items-center gap-8 text-center">
      <div>
        <h1 className="text-primary mb-3 text-3xl font-bold sm:text-4xl">
          Welcome to SplitEase
        </h1>
        <p className="text-lg sm:text-xl">
          Sign in to manage your shared expenses effortlessly.
        </p>
      </div>
      <div className="card w-full max-w-sm">
        <SignInForm />
      </div>
    </div>
  );
}
