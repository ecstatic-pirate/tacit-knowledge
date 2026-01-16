'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/lib/supabase/database.types'

export interface UploadedDocument {
  id: string
  filename: string
  fileSize: number
  fileType: string
  storagePath: string
  aiProcessed: boolean
  extractedTopics: string[]
  createdAt: string
}

interface UseDocumentsOptions {
  campaignId: string
  orgId: string
}

export function useDocuments({ campaignId, orgId }: UseDocumentsOptions) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Fetch documents for a campaign
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setIsLoading(false)
      return
    }

    setDocuments(
      (data || []).map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        fileSize: doc.file_size || 0,
        fileType: doc.file_type || 'unknown',
        storagePath: doc.storage_path,
        aiProcessed: doc.ai_processed || false,
        extractedTopics: Array.isArray(doc.extracted_skills)
          ? (doc.extracted_skills as string[])
          : [],
        createdAt: doc.created_at || '',
      }))
    )
    setIsLoading(false)
  }, [supabase, campaignId])

  // Upload a file
  const uploadFile = useCallback(async (file: File): Promise<UploadedDocument | null> => {
    setError(null)
    const fileId = crypto.randomUUID()

    // Determine file type
    const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    const storagePath = `${orgId}/${campaignId}/${fileId}.${extension}`

    try {
      setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      setUploadProgress((prev) => ({ ...prev, [fileId]: 50 }))

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser()

      // Create document record
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          campaign_id: campaignId,
          uploaded_by: user?.id,
          filename: file.name,
          file_type: extension,
          file_size: file.size,
          storage_path: storagePath,
          ai_processed: false,
          extracted_topics: [],
        })
        .select()
        .single()

      if (dbError) {
        // Cleanup storage if DB insert fails
        await supabase.storage.from('documents').remove([storagePath])
        throw new Error(dbError.message)
      }

      setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }))

      const newDoc: UploadedDocument = {
        id: docData.id,
        filename: docData.filename,
        fileSize: docData.file_size || 0,
        fileType: docData.file_type || extension,
        storagePath: docData.storage_path,
        aiProcessed: false,
        extractedTopics: [],
        createdAt: docData.created_at || '',
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
  }, [supabase, campaignId, orgId])

  // Upload multiple files
  const uploadFiles = useCallback(async (files: File[]): Promise<UploadedDocument[]> => {
    setIsUploading(true)
    const results: UploadedDocument[] = []

    for (const file of files) {
      const doc = await uploadFile(file)
      if (doc) {
        results.push(doc)
      }
    }

    setIsUploading(false)
    return results
  }, [uploadFile])

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return

    // Soft delete in DB
    const { error: dbError } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId)

    if (dbError) {
      setError(dbError.message)
      return
    }

    // Remove from state
    setDocuments((prev) => prev.filter((d) => d.id !== documentId))

    // Optionally delete from storage (commented out for soft delete)
    // await supabase.storage.from('documents').remove([doc.storagePath])
  }, [supabase, documents])

  // Trigger AI processing for a document
  const processDocument = useCallback(async (documentId: string): Promise<string[] | null> => {
    const doc = documents.find((d) => d.id === documentId)
    if (!doc) return null

    try {
      // Call Edge Function to process document
      const { data, error: fnError } = await supabase.functions.invoke('analyze-document', {
        body: { documentId, storagePath: doc.storagePath },
      })

      if (fnError) {
        throw new Error(fnError.message)
      }

      const extractedTopics = data?.topics || []

      // Update document record
      await supabase
        .from('documents')
        .update({
          ai_processed: true,
          ai_processed_at: new Date().toISOString(),
          extracted_topics: extractedTopics,
        })
        .eq('id', documentId)

      // Update local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === documentId
            ? { ...d, aiProcessed: true, extractedTopics }
            : d
        )
      )

      return extractedTopics
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed'
      setError(message)
      return null
    }
  }, [supabase, documents])

  // Get download URL for a document
  const getDownloadUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    const { data, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600) // 1 hour expiry

    if (urlError) {
      setError(urlError.message)
      return null
    }

    return data.signedUrl
  }, [supabase])

  return {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadFile,
    uploadFiles,
    deleteDocument,
    processDocument,
    getDownloadUrl,
  }
}
