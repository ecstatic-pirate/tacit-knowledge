'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Share,
  Link,
  Copy,
  Check,
  CircleNotch,
  X,
  Eye,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ShareToggleProps {
  reportId: string
  initialToken?: string | null
  className?: string
}

interface ShareStatus {
  isShared: boolean
  token: string | null
  shareUrl: string | null
  accessCount: number
}

export function ShareToggle({
  reportId,
  initialToken,
  className,
}: ShareToggleProps) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareStatus, setShareStatus] = useState<ShareStatus>({
    isShared: !!initialToken,
    token: initialToken || null,
    shareUrl: null, // Set in useEffect to avoid SSR hydration mismatch
    accessCount: 0,
  })

  // Build share URL on client side to avoid SSR hydration mismatch
  useEffect(() => {
    if (initialToken) {
      setShareStatus(prev => ({
        ...prev,
        shareUrl: `${window.location.origin}/share/${initialToken}`,
      }))
    }
  }, [initialToken])

  // Fetch current share status
  const fetchShareStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}/share`)
      if (response.ok) {
        const data = await response.json()
        setShareStatus({
          isShared: data.isShared,
          token: data.token,
          shareUrl: data.shareUrl,
          accessCount: data.accessCount || 0,
        })
      }
    } catch (error) {
      console.error('Failed to fetch share status:', error)
    }
  }, [reportId])

  // Generate share link
  const handleGenerateLink = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to generate share link')
      }

      const data = await response.json()
      setShareStatus({
        isShared: true,
        token: data.token,
        shareUrl: data.shareUrl,
        accessCount: 0,
      })
      showToast('Share link created', 'success')
    } catch (error) {
      console.error('Failed to generate share link:', error)
      showToast('Failed to create share link', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Revoke share link
  const handleRevokeLink = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke share link')
      }

      setShareStatus({
        isShared: false,
        token: null,
        shareUrl: null,
        accessCount: 0,
      })
      showToast('Share link revoked', 'success')
    } catch (error) {
      console.error('Failed to revoke share link:', error)
      showToast('Failed to revoke share link', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    if (!shareStatus.shareUrl) return

    try {
      await navigator.clipboard.writeText(shareStatus.shareUrl)
      setCopied(true)
      showToast('Link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      showToast('Failed to copy link', 'error')
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchShareStatus()
        }}
        className={cn(shareStatus.isShared && 'border-primary/50 text-primary')}
      >
        <Share className="w-4 h-4 mr-2" weight="bold" />
        {shareStatus.isShared ? 'Shared' : 'Share'}
      </Button>

      {/* Share Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Share Report</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            {shareStatus.isShared && shareStatus.shareUrl ? (
              <div className="space-y-4">
                {/* Share URL */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm truncate">
                    <Link className="w-4 h-4 inline mr-2 text-muted-foreground" weight="bold" />
                    {shareStatus.shareUrl.replace(/^https?:\/\//, '')}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" weight="bold" />
                    ) : (
                      <Copy className="w-4 h-4" weight="bold" />
                    )}
                  </Button>
                </div>

                {/* Access count */}
                {shareStatus.accessCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" weight="bold" />
                    <span>Viewed {shareStatus.accessCount} time{shareStatus.accessCount !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {/* Info */}
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can view the report without signing in.
                </p>

                {/* Revoke Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevokeLink}
                  disabled={isLoading}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {isLoading ? (
                    <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  ) : null}
                  Revoke Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create a public link that anyone can use to view this report without signing in.
                </p>

                <Button
                  onClick={handleGenerateLink}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  ) : (
                    <Link className="w-4 h-4 mr-2" weight="bold" />
                  )}
                  Create Share Link
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
