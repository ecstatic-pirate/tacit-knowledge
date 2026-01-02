'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCalendar } from '@/lib/hooks/use-calendar'
import { CircleNotch, CheckCircle, XCircle } from 'phosphor-react'

function CalendarCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeConnection } = useCalendar()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setStatus('error')
      setErrorMessage(errorDescription || error)
      return
    }

    if (!code) {
      setStatus('error')
      setErrorMessage('No authorization code received')
      return
    }

    // Complete the OAuth flow
    completeConnection(code).then((success) => {
      if (success) {
        setStatus('success')
        // Redirect back to planner after a short delay
        setTimeout(() => {
          router.push('/planner')
        }, 2000)
      } else {
        setStatus('error')
        setErrorMessage('Failed to connect calendar')
      }
    })
  }, [searchParams, completeConnection, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg text-center">
        {status === 'loading' && (
          <>
            <CircleNotch className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" weight="bold" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Connecting your calendar...
            </h2>
            <p className="text-gray-500">
              Please wait while we complete the connection.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Calendar connected!
            </h2>
            <p className="text-gray-500">
              Redirecting you back to the planner...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Connection failed
            </h2>
            <p className="text-gray-500 mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push('/planner')}
              className="text-primary hover:underline"
            >
              Go back to planner
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function CalendarCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg text-center">
        <CircleNotch className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" weight="bold" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Loading...
        </h2>
      </div>
    </div>
  )
}

export default function CalendarCallbackPage() {
  return (
    <Suspense fallback={<CalendarCallbackFallback />}>
      <CalendarCallbackContent />
    </Suspense>
  )
}
