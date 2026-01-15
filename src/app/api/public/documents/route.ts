import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES_PER_CAMPAIGN = 50
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif']

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .slice(0, 255) // Limit length
}

const FOLDER_IGNORE_PATTERNS = [
  '.git',
  'node_modules',
  '.next',
  '__pycache__',
  '.DS_Store',
  'thumbs.db',
  '.env',
]

// Create a Supabase client with service role for storage operations
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required environment variables for public documents API')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

// Token types allowed to upload documents
const ALLOWED_TOKEN_TYPES = ['expert', 'collaborator']

// Validate token and get campaign info
async function validateToken(supabase: ReturnType<typeof getServiceClient>, token: string) {
  const { data: tokenData, error } = await supabase
    .from('campaign_access_tokens')
    .select(`
      id,
      campaign_id,
      token_type,
      expires_at,
      campaigns (
        id,
        org_id
      )
    `)
    .eq('token', token)
    .single()

  if (error || !tokenData) {
    return null
  }

  // Check token type is allowed
  if (!ALLOWED_TOKEN_TYPES.includes(tokenData.token_type)) {
    return null
  }

  // Check expiration
  if (new Date(tokenData.expires_at) < new Date()) {
    return null
  }

  return tokenData
}

// GET: List documents for a campaign (via token)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const tokenData = await validateToken(supabase, token)

  if (!tokenData) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, filename, file_type, file_size, ai_processed, extracted_topics, created_at')
    .eq('campaign_id', tokenData.campaign_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }

  return NextResponse.json({ documents })
}

// POST: Upload a document (via token)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const token = formData.get('token') as string
    const file = formData.get('file') as File
    const relativePath = formData.get('relativePath') as string | null

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 })
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: `File type .${extension} is not allowed` }, { status: 400 })
    }

    // Check for ignored paths in folder uploads
    if (relativePath) {
      const pathParts = relativePath.split('/')
      const shouldIgnore = pathParts.some(part =>
        FOLDER_IGNORE_PATTERNS.some(pattern =>
          part === pattern || part.startsWith(pattern)
        )
      )
      if (shouldIgnore) {
        return NextResponse.json({ skipped: true, reason: 'Ignored path' }, { status: 200 })
      }
    }

    const supabase = getServiceClient()
    const tokenData = await validateToken(supabase, token)

    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const campaign = tokenData.campaigns as { id: string; org_id: string } | null
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check document count limit
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', tokenData.campaign_id)
      .is('deleted_at', null)

    if (count && count >= MAX_FILES_PER_CAMPAIGN) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES_PER_CAMPAIGN} documents per campaign` }, { status: 400 })
    }

    // Generate unique file ID and storage path
    const fileId = crypto.randomUUID()
    const storagePath = `${campaign.org_id}/${tokenData.campaign_id}/${fileId}.${extension}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Create document record with sanitized filename
    const displayName = sanitizeFilename(relativePath || file.name)
    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        campaign_id: tokenData.campaign_id,
        uploaded_by: null, // Public upload, no user ID
        filename: displayName,
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
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
    }

    return NextResponse.json({
      document: {
        id: docData.id,
        filename: docData.filename,
        fileType: docData.file_type,
        fileSize: docData.file_size,
        aiProcessed: false,
        extractedTopics: [],
        createdAt: docData.created_at,
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE: Remove a document (via token)
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const documentId = searchParams.get('documentId')

  if (!token || !documentId) {
    return NextResponse.json({ error: 'Token and documentId are required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const tokenData = await validateToken(supabase, token)

  if (!tokenData) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // Verify document belongs to this campaign
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('id', documentId)
    .eq('campaign_id', tokenData.campaign_id)
    .single()

  if (fetchError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', documentId)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
