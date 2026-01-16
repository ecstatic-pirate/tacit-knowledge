'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Printer,
  Warning,
  FileText,
  CircleNotch,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { ReportContent } from '@/components/reports/report-content'
import type { Report } from '@/lib/hooks/use-reports'

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch report by token
  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/public/report?token=${encodeURIComponent(token)}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('This report link is invalid or has been revoked.')
        } else if (response.status === 410) {
          setError('This report link has expired.')
        } else {
          setError('Failed to load report.')
        }
        return
      }

      const data = await response.json()
      setReport(data.report)
    } catch (err) {
      console.error('Error fetching shared report:', err)
      setError('Failed to load report.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // Poll for generating reports
  useEffect(() => {
    if (!report) return
    if (report.status !== 'generating' && report.status !== 'pending') return

    const interval = setInterval(() => {
      fetchReport()
    }, 5000)

    return () => clearInterval(interval)
  }, [report, fetchReport])

  // Print handler
  const handlePrint = () => {
    window.print()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CircleNotch className="w-8 h-8 animate-spin text-primary mx-auto mb-4" weight="bold" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Warning className="w-12 h-12 text-destructive mx-auto mb-6" weight="bold" />
          <h1 className="text-2xl font-bold font-serif mb-3">
            {error === 'This report link has expired.' ? 'Link Expired' : 'Report Not Found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This report could not be found.'}
          </p>
          <Link href="/login">
            <Button variant="outline">
              Sign in to view reports
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Minimal Header - Hidden when printing */}
      <header className="border-b bg-background print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo / Branding */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" weight="bold" />
              </div>
              <span className="font-semibold text-lg">Tacit Knowledge</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                Shared Report
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" weight="bold" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 print:py-0 print:px-0 print:max-w-none">
        <ReportContent
          report={report}
          variant="full-page"
          showHeader={true}
        />
      </main>

      {/* Footer - Hidden when printing */}
      <footer className="border-t py-6 mt-12 print:hidden">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>
            This report was shared via{' '}
            <Link href="/" className="text-primary hover:underline">
              Tacit Knowledge
            </Link>
          </p>
        </div>
      </footer>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            margin: 1in;
          }
        }
      `}</style>
    </div>
  )
}
