'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  FileText,
  CloudArrowUp,
  CheckCircle,
  File,
  X,
  Sparkle,
  CircleNotch,
  WarningCircle,
  FolderOpen,
  ClipboardText,
  Image as ImageIcon,
} from 'phosphor-react'
import { cn } from '@/lib/utils'
import { useDocuments, type UploadedDocument } from '@/lib/hooks/use-documents'
import { usePublicDocuments, type PublicDocument } from '@/lib/hooks/use-public-documents'
import { Button } from '@/components/ui/button'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif']
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
]

// Unified document type for display
type DisplayDocument = UploadedDocument | PublicDocument

interface FileUploadProps {
  // Authenticated mode props
  campaignId?: string
  orgId?: string
  // Public mode props (token-based)
  token?: string
  // Callbacks
  onDocumentsChange?: (documents: DisplayDocument[]) => void
  onSkillsExtracted?: (skills: string[]) => void
  // UI options
  compact?: boolean
  showAnalyzeButton?: boolean
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
  token,
  onDocumentsChange,
  onSkillsExtracted,
  compact = false,
  showAnalyzeButton = true,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pasteMessage, setPasteMessage] = useState<string | null>(null)

  // Determine which mode we're in
  const isPublicMode = Boolean(token)
  const isAuthenticatedMode = Boolean(campaignId && orgId)
  const isEnabled = isPublicMode || isAuthenticatedMode

  // Use the appropriate hook based on mode
  const authenticatedHook = useDocuments({
    campaignId: campaignId || '',
    orgId: orgId || '',
  })

  const publicHook = usePublicDocuments({
    token: token || '',
  })

  // Select the active hook's values
  const activeHook = isPublicMode ? publicHook : authenticatedHook
  const {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadFiles,
    deleteDocument,
  } = activeHook

  // Only authenticated mode has processDocument
  const processDocument = isPublicMode ? undefined : authenticatedHook.processDocument

  useEffect(() => {
    if (isEnabled) {
      fetchDocuments()
    }
  }, [isEnabled, fetchDocuments])

  useEffect(() => {
    if (onDocumentsChange) {
      onDocumentsChange(documents)
    }
  }, [documents, onDocumentsChange])

  // Validate a file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds 10MB limit`
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `File type ".${extension}" not supported`
    }
    return null
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('ring-2', 'ring-primary')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-primary')
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.currentTarget.classList.remove('ring-2', 'ring-primary')

      if (!isEnabled) return

      const files = Array.from(e.dataTransfer.files)
      const validFiles = files.filter((f) => {
        const error = validateFile(f)
        return !error && (ALLOWED_MIME_TYPES.includes(f.type) || f.type === '')
      })

      if (validFiles.length > 0) {
        await uploadFiles(validFiles)
      }
    },
    [isEnabled, uploadFiles, validateFile]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isEnabled || !e.target.files) return

      const files = Array.from(e.target.files)
      const validFiles = files.filter((f) => !validateFile(f))

      if (validFiles.length > 0) {
        await uploadFiles(validFiles)
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [isEnabled, uploadFiles, validateFile]
  )

  // Handle folder upload
  const handleFolderSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isEnabled || !e.target.files) return

      const files = Array.from(e.target.files)
      const validFiles = files.filter((f) => !validateFile(f))

      if (validFiles.length > 0) {
        // For public mode with paths, use uploadFilesWithPaths if available
        if (isPublicMode && 'uploadFilesWithPaths' in publicHook) {
          const filesWithPaths = validFiles.map((f) => ({
            file: f,
            relativePath: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
          }))
          await publicHook.uploadFilesWithPaths(filesWithPaths)
        } else {
          await uploadFiles(validFiles)
        }
      }

      if (folderInputRef.current) {
        folderInputRef.current.value = ''
      }
    },
    [isEnabled, isPublicMode, publicHook, uploadFiles, validateFile]
  )

  // Handle paste from clipboard
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!isEnabled) return

      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file && !validateFile(file)) {
            files.push(file)
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault()
        setPasteMessage(`Uploading ${files.length} file(s) from clipboard...`)
        await uploadFiles(files)
        setPasteMessage(null)
      }
    },
    [isEnabled, uploadFiles, validateFile]
  )

  // Set up paste listener
  useEffect(() => {
    const container = containerRef.current
    if (!container || !isEnabled) return

    const handlePasteEvent = (e: Event) => handlePaste(e as ClipboardEvent)

    // Listen on document for paste events when container is focused
    document.addEventListener('paste', handlePasteEvent)

    return () => {
      document.removeEventListener('paste', handlePasteEvent)
    }
  }, [handlePaste, isEnabled])

  const handleClick = useCallback(() => {
    if (isEnabled) {
      fileInputRef.current?.click()
    }
  }, [isEnabled])

  const handleFolderClick = useCallback(() => {
    if (isEnabled) {
      folderInputRef.current?.click()
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
      if (!processDocument) return
      const skills = await processDocument(docId)
      if (skills && onSkillsExtracted) {
        onSkillsExtracted(skills)
      }
    },
    [processDocument, onSkillsExtracted]
  )

  return (
    <div ref={containerRef} className={cn("border rounded-lg bg-card", compact && "border-0 bg-transparent")}>
      {!compact && (
        <div className="p-4 border-b flex items-center gap-3">
          <div className="p-2 rounded-md bg-secondary">
            <FileText className="w-4 h-4 text-muted-foreground" weight="bold" />
          </div>
          <div>
            <h3 className="font-medium">Upload Documents</h3>
            <p className="text-xs text-muted-foreground">
              Add documentation, presentations, and materials
            </p>
          </div>
        </div>
      )}

      <div className={cn("p-4", compact && "p-0")}>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <WarningCircle className="w-4 h-4" weight="bold" />
            {error}
          </div>
        )}

        {pasteMessage && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 text-primary text-sm">
            <ClipboardText className="w-4 h-4" weight="bold" />
            {pasteMessage}
          </div>
        )}

        {/* Upload zone */}
        <div
          className={cn(
            'rounded-lg p-6 text-center transition-all border-2 border-dashed',
            isEnabled
              ? 'cursor-pointer border-border hover:border-primary/50 hover:bg-secondary/30'
              : 'cursor-not-allowed border-border/50 bg-secondary/20 opacity-60'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif"
            className="hidden"
            onChange={handleFileSelect}
            disabled={!isEnabled}
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is not in the types but is widely supported
            webkitdirectory=""
            multiple
            className="hidden"
            onChange={handleFolderSelect}
            disabled={!isEnabled}
          />

          <div className={cn(
            'mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-3',
            isUploading ? 'bg-primary' : 'bg-secondary'
          )}>
            {isUploading ? (
              <CircleNotch className="w-6 h-6 text-primary-foreground animate-spin" weight="bold" />
            ) : (
              <CloudArrowUp className="w-6 h-6 text-muted-foreground" weight="bold" />
            )}
          </div>

          <p className="font-medium text-sm mb-1">
            {!isEnabled
              ? 'Complete previous steps first'
              : isUploading
              ? 'Uploading files...'
              : 'Drop files here or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            PDF, DOCX, TXT, PPT, Images supported (max 10MB)
          </p>

          {/* Action buttons */}
          {isEnabled && !isUploading && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFolderClick()
                }}
                className="text-xs"
                title="Select a folder, then click 'Open' to upload all files inside"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" weight="bold" />
                Select Folder
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ClipboardText className="w-3 h-3" weight="bold" />
                or paste (Ctrl+V)
              </span>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
            <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
            <span className="text-sm">Loading documents...</span>
          </div>
        )}

        {/* Uploaded files */}
        {documents.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" weight="bold" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Uploaded ({documents.length})
              </span>
            </div>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 group"
                >
                  <div className="p-2 rounded-md bg-secondary">
                    <File className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.aiProcessed ? (
                        <span className="text-emerald-600">
                          {doc.extractedSkills.length} skills extracted
                        </span>
                      ) : (
                        'Ready for analysis'
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  {showAnalyzeButton && processDocument && !doc.aiProcessed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleProcess(doc.id)
                      }}
                      className="opacity-0 group-hover:opacity-100"
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
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
