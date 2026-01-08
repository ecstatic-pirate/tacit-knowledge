'use client'

import { Check } from 'phosphor-react'
import { Button } from '@/components/ui/button'

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-xl p-8 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-emerald-500" weight="bold" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
        <p className="text-zinc-400 mb-6">
          Your knowledge has been captured and will help your team succeed.
        </p>

        <div className="bg-zinc-800 rounded-lg p-4 mb-6 text-left text-sm text-zinc-300">
          <p className="mb-2">What happens next:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">1</span>
              Your insights are being processed by AI
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">2</span>
              Key knowledge is added to the knowledge graph
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">3</span>
              Your team will have access to the captured insights
            </li>
          </ul>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.close()}
        >
          Close This Window
        </Button>
      </div>
    </div>
  )
}
