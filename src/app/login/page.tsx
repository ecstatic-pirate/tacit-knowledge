'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkle, CircleNotch } from 'phosphor-react'

const DEMO_CREDENTIALS = {
  email: 'demo@tacit.local',
  password: 'DemoPass123!',
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      {/* Demo Access Banner */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4 mb-2">
        <p className="text-sm font-medium text-violet-900 mb-2">
          Want to explore? Try the demo account
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-violet-300 text-violet-700 hover:bg-violet-100"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
              Signing in...
            </>
          ) : (
            'Sign in as Demo User'
          )}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or sign in with email</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}

function LoginFormFallback() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-4">
        <div className="h-10 bg-secondary rounded" />
        <div className="h-10 bg-secondary rounded" />
      </div>
      <div className="h-10 bg-secondary rounded" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded bg-primary text-primary-foreground mx-auto mb-4">
            <Sparkle className="w-5 h-5" weight="fill" />
          </div>
          <h1 className="text-2xl font-serif font-bold">Sign in to Tacit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture expert knowledge before it walks out the door.
          </p>
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
