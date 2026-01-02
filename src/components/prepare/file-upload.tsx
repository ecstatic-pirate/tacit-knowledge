'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  FileText,
  CloudArrowUp,
  CheckCircle,
  ChartBar,
  ListChecks,
  Target,
  File,
  X,
  Sparkle,
  CircleNotch,
  WarningCircle,
} from 'phosphor-react'
import { cn } from '@/lib/utils'
import { useDocuments, type UploadedDocument } from '@/lib/hooks/use-documents'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  campaignId?: string
  orgId?: string
  onDocumentsChange?: (documents: UploadedDocument[]) => void
  onSkillsExtracted?: (skills: string[]) => void
}

const fileConfig: Record<string, { icon: any; gradient: string; bgClass: string }> = {
  pdf: {
    icon: ChartBar,
    gradient: 'from-red-500 to-rose-500',
    bgClass: 'bg-gradient-to-br from-red-500 to-rose-500',
  },
  doc: {
    icon: ListChecks,
    gradient: 'from-blue-500 to-cyan-500',
    bgClass: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  },
  docx: {
    icon: ListChecks,
    gradient: 'from-blue-500 to-cyan-500',
    bgClass: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  },
  ppt: {
    icon: Target,
    gradient: 'from-orange-500 to-amber-500',
    bgClass: 'bg-gradient-to-br from-orange-500 to-amber-500',
  },
  pptx: {
    icon: Target,
    gradient: 'from-orange-500 to-amber-500',
    bgClass: 'bg-gradient-to-br from-orange-500 to-amber-500',
  },
  txt: {
    icon: FileText,
    gradient: 'from-neutral-500 to-neutral-600',
    bgClass: 'bg-gradient-to-br from-neutral-500 to-neutral-600',
  },
  csv: {
    icon: FileText,
    gradient: 'from-green-500 to-emerald-500',
    bgClass: 'bg-gradient-to-br from-green-500 to-emerald-500',
  },
  other: {
    icon: File,
    gradient: 'from-neutral-400 to-neutral-500',
    bgClass: 'bg-gradient-to-br from-neutral-400 to-neutral-500',
  },
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function FileUpload({
  campaignId,
  orgId,
  onDocumentsChange,
  onSkillsExtracted,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use mock mode if no campaignId/orgId provided
  const isEnabled = Boolean(campaignId && orgId)

  const {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadFiles,
    deleteDocument,
    processDocument,
  } = useDocuments({
    campaignId: campaignId || '',
    orgId: orgId || '',
  })

  // Fetch documents on mount
  useEffect(() => {
    if (isEnabled) {
      fetchDocuments()
    }
  }, [isEnabled, fetchDocuments])

  // Notify parent of document changes
  useEffect(() => {
    if (onDocumentsChange) {
      onDocumentsChange(documents)
    }
  }, [documents, onDocumentsChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over')
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.currentTarget.classList.remove('drag-over')

      if (!isEnabled) return

      const files = Array.from(e.dataTransfer.files)
      const validFiles = files.filter((f) =>
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv'].includes(f.type)
      )

      if (validFiles.length > 0) {
        await uploadFiles(validFiles)
      }
    },
    [isEnabled, uploadFiles]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isEnabled || !e.target.files) return

      const files = Array.from(e.target.files)
      await uploadFiles(files)

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [isEnabled, uploadFiles]
  )

  const handleClick = useCallback(() => {
    if (isEnabled) {
      fileInputRef.current?.click()
    }
  }, [isEnabled])

  const handleDelete = useCallback(
    async (docId: string) => {
      await deleteDocument(docId)
    },
    [deleteDocument]
  )

  const handleProcess = useCallback(
    async (docId: string) => {
      const skills = await processDocument(docId)
      if (skills && onSkillsExtracted) {
        onSkillsExtracted(skills)
      }
    },
    [processDocument, onSkillsExtracted]
  )

  const isDragOver = false // Managed via CSS class

  return (
    <div className="bg-white rounded-2xl p-8 mb-8 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/20">
          <FileText className="w-5 h-5 text-white" weight="bold" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Add Explicit Knowledge</h3>
          <p className="text-xs text-neutral-500">
            Upload documentation, presentations, and materials
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <WarningCircle className="w-4 h-4" weight="bold" />
          {error}
        </div>
      )}

      {/* Upload zone */}
      <div
        className={cn(
          'relative rounded-2xl p-10 text-center transition-all duration-300 border-2 border-dashed overflow-hidden group',
          isEnabled
            ? 'cursor-pointer border-neutral-200 bg-gradient-to-br from-neutral-50 to-slate-50 hover:border-primary/50 hover:from-primary/5 hover:to-violet-50'
            : 'cursor-not-allowed border-neutral-100 bg-neutral-50 opacity-60',
          '[&.drag-over]:border-primary [&.drag-over]:bg-primary/5 [&.drag-over]:scale-[0.99]'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv"
          className="hidden"
          onChange={handleFileSelect}
          disabled={!isEnabled}
        />

        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div
          className={cn(
            'relative mx-auto w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-5 transition-all duration-300',
            isUploading
              ? 'bg-gradient-to-br from-primary to-violet-500 animate-pulse'
              : 'bg-white group-hover:scale-105'
          )}
        >
          {isUploading ? (
            <CircleNotch className="w-8 h-8 text-white animate-spin" weight="bold" />
          ) : (
            <CloudArrowUp
              className={cn(
                'w-8 h-8 transition-all duration-300',
                'text-neutral-400 group-hover:text-primary'
              )}
              weight="bold"
            />
          )}
        </div>
        <div className="relative font-bold mb-2 text-neutral-900 text-lg">
          {!isEnabled
            ? 'Create a campaign first to upload files'
            : isUploading
            ? 'Uploading files...'
            : 'Drop files here or click to upload'}
        </div>
        <div className="relative text-sm text-neutral-500 flex items-center justify-center gap-2">
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">PDF</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">DOCX</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">TXT</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">PPT</span>
        </div>
      </div>

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500">{progress}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-neutral-500">
          <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
          <span className="text-sm">Loading documents...</span>
        </div>
      )}

      {/* Uploaded files */}
      {documents.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-100">
          <div className="font-bold mb-4 text-neutral-900 flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-100">
              <CheckCircle className="w-4 h-4 text-emerald-600" weight="bold" />
            </div>
            <span>Uploaded Files</span>
            <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500">
              {documents.length} files
            </span>
          </div>
          <div className="space-y-2">
            {documents.map((doc, index) => {
              const config = fileConfig[doc.fileType] || fileConfig.other
              const Icon = config.icon

              return (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100',
                    'group hover:bg-white hover:border-neutral-200 hover:shadow-sm transition-all duration-200',
                    'animate-fade-in'
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className={cn(
                      'p-2.5 rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105',
                      config.bgClass
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-neutral-800 truncate group-hover:text-neutral-900 transition-colors">
                      {doc.filename}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      {doc.aiProcessed ? (
                        <>
                          <Sparkle className="w-3 h-3 text-amber-500" weight="bold" />
                          <span className="text-amber-600">
                            {doc.extractedSkills.length} skills extracted
                          </span>
                        </>
                      ) : (
                        <span>Ready for AI analysis</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-1 rounded">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  {!doc.aiProcessed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleProcess(doc.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Sparkle className="w-3 h-3 mr-1" weight="bold" />
                      Analyze
                    </Button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(doc.id)
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
