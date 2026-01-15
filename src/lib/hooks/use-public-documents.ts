'use client'

import { useState, useCallback } from 'react'

export interface PublicDocument {
  id: string
  filename: string
  fileSize: number
  fileType: string
  aiProcessed: boolean
  extractedTopics: string[]
  createdAt: string
}

interface UsePublicDocumentsOptions {
  token: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif']

export function usePublicDocuments({ token }: UsePublicDocumentsOptions) {
  const [documents, setDocuments] = useState<PublicDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  // Fetch documents for a campaign via token
  const fetchDocuments = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/public/documents?token=${encodeURIComponent(token)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch documents')
      }

      setDocuments(
        (data.documents || []).map((doc: {
          id: string
          filename: string
          file_size: number
          file_type: string
          ai_processed: boolean
          extracted_topics: string[]
          created_at: string
        }) => ({
          id: doc.id,
          filename: doc.filename,
          fileSize: doc.file_size || 0,
          fileType: doc.file_type || 'unknown',
          aiProcessed: doc.ai_processed || false,
          extractedTopics: Array.isArray(doc.extracted_topics) ? doc.extracted_topics : [],
          createdAt: doc.created_at || '',
        }))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `File type ".${extension}" is not allowed. Supported: ${ALLOWED_EXTENSIONS.join(', ')}`
    }

    return null
  }, [])

  // Upload a single file
  const uploadFile = useCallback(async (file: File, relativePath?: string): Promise<PublicDocument | null> => {
    if (!token) return null

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return null
    }

    const fileId = crypto.randomUUID()
    setError(null)

    try {
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))

      const formData = new FormData()
      formData.append('token', token)
      formData.append('file', file)
      if (relativePath) {
        formData.append('relativePath', relativePath)
      }

      setUploadProgress((prev) => ({ ...prev, [fileId]: 30 }))

      const response = await fetch('/api/public/documents', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      setUploadProgress((prev) => ({ ...prev, [fileId]: 90 }))

      // Check if file was skipped (e.g., ignored path)
      if (data.skipped) {
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[fileId]
          return next
        })
        return null
      }

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }))

      const newDoc: PublicDocument = {
        id: data.document.id,
        filename: data.document.filename,
        fileSize: data.document.fileSize || 0,
        fileType: data.document.fileType || 'unknown',
        aiProcessed: false,
        extractedTopics: [],
        createdAt: data.document.createdAt || '',
      }

      setDocuments((prev) => [newDoc, ...prev])

      // Cleanup progress
      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[fileId]
          return next
        })
      }, 1000)

      return newDoc
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      setUploadProgress((prev) => {
        const next = { ...prev }
        delete next[fileId]
        return next
      })
      return null
    }
  }, [token, validateFile])

  // Upload multiple files
  const uploadFiles = useCallback(async (files: File[]): Promise<PublicDocument[]> => {
    setIsUploading(true)
    setError(null)
    const results: PublicDocument[] = []

    for (const file of files) {
      const doc = await uploadFile(file)
      if (doc) {
        results.push(doc)
      }
    }

    setIsUploading(false)
    return results
  }, [uploadFile])

  // Upload files with relative paths (for folder uploads)
  const uploadFilesWithPaths = useCallback(async (
    filesWithPaths: Array<{ file: File; relativePath: string }>
  ): Promise<PublicDocument[]> => {
    setIsUploading(true)
    setError(null)
    const results: PublicDocument[] = []

    for (const { file, relativePath } of filesWithPaths) {
      const doc = await uploadFile(file, relativePath)
      if (doc) {
        results.push(doc)
      }
    }

    setIsUploading(false)
    return results
  }, [uploadFile])

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string) => {
    if (!token) return

    try {
      const response = await fetch(
        `/api/public/documents?token=${encodeURIComponent(token)}&documentId=${documentId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document')
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      setError(message)
    }
  }, [token])

  return {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadFile,
    uploadFiles,
    uploadFilesWithPaths,
    deleteDocument,
    validateFile,
  }
}
