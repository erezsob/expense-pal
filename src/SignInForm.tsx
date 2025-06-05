import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from './components/ui/text'

export function SignInForm() {
  const navigate = useNavigate()
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.target as HTMLFormElement)
    formData.set('flow', flow)
    signIn('password', formData).catch((error) => {
      let toastTitle = ''
      if (error.message.includes('Invalid password')) {
        toastTitle = 'Invalid password. Please try again.'
      } else {
        toastTitle =
          flow === 'signIn'
            ? 'Could not sign in, did you mean to sign up?'
            : 'Could not sign up, did you mean to sign in?'
      }
      toast.error(toastTitle)
      setSubmitting(false)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-5">
      <div>
        <Text className="mb-1 text-2xl font-bold">
          {flow === 'signIn' ? 'Sign In' : 'Sign Up'}
        </Text>
        <Text variant="muted" className="mb-4 text-sm">
          Access your account or create a new one to manage your groups.
        </Text>
      </div>
      <Input type="email" name="email" placeholder="Email" required />
      <Input type="password" name="password" placeholder="Password" required />
      <Button type="submit" disabled={submitting} className="w-full">
        {flow === 'signIn' ? 'Sign in' : 'Sign up'}
      </Button>
      <div className="mt-2 flex items-center justify-center gap-4 text-sm">
        <span className="text-primary font-medium">
          {flow === 'signIn'
            ? "Don't have an account? "
            : 'Already have an account? '}
        </span>
        <Button
          type="button"
          variant="link"
          onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
        >
          {flow === 'signIn' ? 'Sign up instead' : 'Sign in instead'}
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-center">
          <hr className="grow border-gray-200" />
          <span className="text-primary mx-4">or</span>
          <hr className="grow border-gray-200" />
        </div>
        <Button
          className="auth-button w-full"
          onClick={() => {
            signIn('anonymous')
            navigate({ to: '/' })
          }}
        >
          Sign in anonymously
        </Button>
      </div>
    </form>
  )
}
