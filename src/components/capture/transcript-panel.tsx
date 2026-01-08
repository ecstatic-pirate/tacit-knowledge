'use client'

import { useEffect, useRef } from 'react'
import { TextAlignLeft, Waves, CircleNotch } from 'phosphor-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TranscriptLine } from '@/lib/hooks/use-realtime-transcription'

interface TranscriptPanelProps {
  lines: TranscriptLine[]
  currentInterim?: string | null
  isTranscribing: boolean
  isConnecting?: boolean
  className?: string
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TranscriptPanel({
  lines,
  currentInterim,
  isTranscribing,
  isConnecting,
  className,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, currentInterim])

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="py-3 border-b flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
            <TextAlignLeft className="w-4 h-4" weight="bold" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">Live Transcript</h3>
            <div className="flex items-center gap-2">
              {isConnecting ? (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <CircleNotch className="w-3 h-3 animate-spin" weight="bold" />
                  Connecting...
                </span>
              ) : isTranscribing ? (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <Waves className="w-3 h-3 animate-pulse" weight="bold" />
                  Listening
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Ready
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-3">
          {lines.length === 0 && !currentInterim ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {isConnecting ? (
                <>
                  <CircleNotch className="w-6 h-6 animate-spin mx-auto mb-2" weight="bold" />
                  Connecting to transcription service...
                </>
              ) : isTranscribing ? (
                <>
                  <Waves className="w-6 h-6 mx-auto mb-2 animate-pulse" weight="bold" />
                  Listening for speech...
                </>
              ) : (
                <>
                  <TextAlignLeft className="w-6 h-6 mx-auto mb-2" weight="bold" />
                  Transcript will appear here when the call starts
                </>
              )}
            </div>
          ) : (
            <>
              {lines.map((line, index) => (
                <div key={index} className="group">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={cn(
                      'text-xs font-semibold',
                      line.speaker.toLowerCase().includes('you') || line.speaker === 'Speaker 0'
                        ? 'text-primary'
                        : 'text-emerald-600'
                    )}>
                      {line.speaker}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimestamp(line.timestampSeconds)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {line.text}
                  </p>
                </div>
              ))}

              {/* Current interim text */}
              {currentInterim && (
                <div className="opacity-60">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      ...
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {currentInterim}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
