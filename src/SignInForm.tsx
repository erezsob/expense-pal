import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Input type="email" name="email" placeholder="Email" required />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <Button type="submit" disabled={submitting}>
            {flow === 'signIn' ? 'Sign in' : 'Sign up'}
          </Button>
          <div className="text-secondary flex items-center justify-center gap-8 text-sm">
            <span className="text-primary font-medium">
              {flow === 'signIn'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </span>
            <Button
              type="button"
              onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
            >
              {flow === 'signIn' ? 'Sign up instead' : 'Sign in instead'}
            </Button>
          </div>
        </div>
      </form>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center">
          <hr className="grow border-gray-200" />
          <span className="text-primary mx-4">or</span>
          <hr className="grow border-gray-200" />
        </div>
        <Button
          className="auth-button"
          onClick={() => {
            signIn('anonymous')
            navigate({ to: '/' })
          }}
        >
          Sign in anonymously
        </Button>
      </div>
    </div>
  )
}
