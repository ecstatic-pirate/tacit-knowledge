import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
  console.error('Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiKey })

const ORG_ID = 'bcfbba55-4e7d-408f-ab12-2e77b11162b7' // getAbstract AG

// Demo knowledge content
const DEMO_KNOWLEDGE = [
  {
    type: 'transcript',
    id: 'd0000001-0001-0001-0001-000000000001',
    campaignId: 'c1111111-1111-1111-1111-111111111111',
    text: `Editorial Workflow Overview with Dr. Marcus Weber

Dr. Weber explains the core editorial process at getAbstract:

"Our editorial workflow has been refined over 20 years. When a new book comes in, it goes through several stages:

First, we do an initial assessment. Not every book is right for getAbstract. We look at the author's credibility, the relevance to our business audience, and whether the content offers actionable insights.

Once approved, the book goes to our summarizers. We have subject matter experts in different domains - finance, leadership, technology, personal development. They read the full book and create a first draft summary.

Quality is everything. The summary then goes through a two-tier review process. First, a senior editor checks for accuracy and completeness. Then, our editorial leads review for style and consistency with the getAbstract voice.

The key thing that makes us different is we don't just condense - we distill. We identify the three to five key takeaways that will actually help someone in their work. That's what our readers pay for."

On publisher relationships:
"Publishers are partners, not obstacles. We've built trust over decades by being transparent about our process and always maintaining the integrity of the author's message. When there's a disagreement, we start by understanding their concern. Usually it's a misunderstanding that can be resolved through dialogue."`,
    metadata: { title: 'Editorial Workflow Overview', expert: 'Dr. Marcus Weber' }
  },
  {
    type: 'transcript',
    id: 'd0000001-0001-0001-0001-000000000002',
    campaignId: '2bf4f52a-e52c-4c77-9ca1-3a2640e82fe8',
    text: `Verify Platform Architecture Session with Raphael

Raphael describes the Verify platform technical architecture:

"The Verify platform is our content verification and quality assurance system. It handles thousands of documents daily and integrates with multiple internal and external systems.

The core architecture has three main layers:

1. Ingestion Layer - This handles incoming content from publishers, authors, and our editorial team. We support PDF, EPUB, Word docs, and plain text. There's an OCR pipeline for scanned materials.

2. Processing Layer - This is where the magic happens. We have AI models that analyze content structure, extract key themes, and flag potential issues. The fact-checking module cross-references claims against our trusted source database.

3. Verification Layer - Human reviewers work through a queue system. The AI assigns confidence scores, so reviewers can prioritize low-confidence sections. Everything is tracked for audit purposes.

The Maintenance Dashboard is our operations center. It shows real-time processing queues, system health, and team performance metrics. We're currently working on predictive analytics to anticipate bottlenecks before they happen.

Tech stack: Node.js microservices, React frontend, PostgreSQL database. We run on AWS with Kubernetes for orchestration. The AI models are a mix of custom-trained and fine-tuned open source models."`,
    metadata: { title: 'Verify Platform Architecture', expert: 'Raphael' }
  },
  {
    type: 'transcript',
    id: 'd0000001-0001-0001-0001-000000000003',
    campaignId: 'c3333333-3333-3333-3333-333333333333',
    text: `AI Systems and Training Processes with Lucas Brunner

Lucas explains how the AI summarization system works:

"Our AI isn't replacing editors - it's augmenting them. Think of it as a very smart first draft generator that understands the getAbstract style.

The pipeline has three main agents:

Document Analysis Agent - This reads the full document and creates a structural map. It identifies chapters, key arguments, supporting evidence, and conclusions. It also flags anything that might need human attention - controversial claims, technical jargon, complex statistics.

Summarization Agent - This is our fine-tuned language model. We trained it on over 10,000 approved getAbstract summaries. It doesn't just compress text - it's learned our voice, our formatting conventions, our emphasis on actionable takeaways.

Quality Assurance Agent - This is the gatekeeper. It checks the AI output against the source material for factual consistency, verifies it meets our length and format requirements, and generates improvement suggestions.

Training is continuous. Every time an editor corrects an AI output, that feedback goes back into our training data. We do monthly retraining cycles. The model gets better every month.

Human oversight is non-negotiable. Every AI-generated summary is reviewed by a human editor before publication. The AI gives us speed; our editors give us trust."`,
    metadata: { title: 'AI Systems Architecture', expert: 'Lucas Brunner' }
  },
  {
    type: 'transcript',
    id: 'd0000001-0001-0001-0001-000000000004',
    campaignId: 'e27227ee-80fc-4399-8138-96618f091f34',
    text: `Middle East Regional Sales Knowledge with Gabriel

Gabriel shares insights on selling in the Middle East:

"The Middle East is not one market - it's a collection of distinct cultures with some shared elements. You need to understand both the commonalities and the differences.

Cultural fundamentals:
- Relationships come before business. Don't try to close deals in the first meeting. Invest time in building genuine connections.
- Hospitality is sacred. Accept invitations to coffee or meals. Declining can be seen as disrespectful.
- Hierarchy matters. Make sure you're speaking to decision-makers, but respect the chain of command.
- Time moves differently. What takes 3 months in Europe might take 12 months here. But when you close, you often get longer-term commitments.

Key markets:

UAE (Dubai/Abu Dhabi) - Most westernized, fastest decision cycles. Strong government investment in education and corporate training. Key sectors: banking, government, real estate.

Saudi Arabia - Largest market by far. Vision 2030 is driving massive investment in human capital development. Longer sales cycles but bigger deal sizes. Local partnerships often required.

Qatar, Kuwait, Bahrain - Smaller but high-value. Personal referrals are crucial. The business community is tight-knit.

Common mistakes Western salespeople make:
1. Rushing to close
2. Not investing in the relationship
3. Underestimating local competitors
4. Ignoring cultural norms around Ramadan and prayer times

My key contacts have been built over 15 years. For my deputies, I'll make personal introductions. That warm handoff is essential."`,
    metadata: { title: 'Middle East Sales Strategies', expert: 'Gabriel' }
  },
  {
    type: 'transcript',
    id: 'd0000001-0001-0001-0001-000000000005',
    campaignId: '101d2084-8ed8-4b33-a932-ba3d6ea86d90',
    text: `Verify Automation System with Shantanu

Shantanu explains the automation layer of the Verify system:

"The automation system sits between content ingestion and human review. Its job is to do as much preprocessing as possible so human reviewers can focus on judgment calls, not mechanical tasks.

Key automation components:

1. Auto-Classification - When a document comes in, we automatically categorize it by subject area, complexity level, and urgency. This determines routing - which reviewer queue it goes to, what priority it gets.

2. Structure Extraction - We parse documents to identify chapters, sections, key quotes, statistics, and claims that need verification. This creates a standardized internal format regardless of input type.

3. Pre-Verification - For factual claims, we automatically check against our trusted source database. If we find a match with high confidence, we pre-approve it. If there's a conflict or no match, we flag it for human review.

4. Quality Scoring - Every document gets an automated quality score based on writing clarity, source reliability, and content relevance. Low scores trigger additional review steps.

The business rationale: We process thousands of documents. Without automation, we'd need 3x the staff. The automation handles the 80% that's routine, so humans can focus on the 20% that requires judgment.

Lessons learned:
- Start simple. Our first version just did basic classification. We added complexity gradually.
- Always have a human escape hatch. Automation should never be a black box.
- Monitor constantly. We track automation accuracy weekly and retrain when it dips."`,
    metadata: { title: 'Verify Automation System', expert: 'Shantanu' }
  },
  {
    type: 'insight',
    id: 'd0000001-0001-0001-0002-000000000001',
    campaignId: 'c1111111-1111-1111-1111-111111111111',
    text: `Key Insight: Editorial Quality Standards

The foundation of getAbstract's value proposition is trust in content quality.

Three pillars of quality:
1. Accuracy - Every fact must be verifiable, every claim attributable
2. Relevance - Content must offer actionable value for business professionals
3. Consistency - The getAbstract voice must be maintained across all summaries

Quality control is a multi-stage process with human oversight at every step. AI tools assist but never replace human judgment on quality matters.`,
    metadata: { title: 'Editorial Quality Standards', category: 'Process' }
  },
  {
    type: 'insight',
    id: 'd0000001-0001-0001-0002-000000000002',
    campaignId: '2bf4f52a-e52c-4c77-9ca1-3a2640e82fe8',
    text: `Key Insight: Verify Platform Scalability

The Verify platform processes 2,000+ documents daily with 99.9% uptime.

Key architectural decisions:
- Microservices allow independent scaling of bottleneck services
- Kubernetes handles auto-scaling during peak periods
- PostgreSQL with pgvector enables semantic search across content
- Redis caching reduces database load by 60%

Future roadmap includes edge deployment for faster international processing.`,
    metadata: { title: 'Platform Scalability', category: 'Technical' }
  },
  {
    type: 'insight',
    id: 'd0000001-0001-0001-0002-000000000003',
    campaignId: 'e27227ee-80fc-4399-8138-96618f091f34',
    text: `Key Insight: Middle East Sales Success Factors

Success in Middle East sales requires patience and relationship investment.

Critical success factors:
1. Relationship building before business discussions (expect 3-6 months)
2. Understanding cultural nuances (hospitality, hierarchy, timing)
3. Local partnerships for market access (especially Saudi Arabia)
4. Long-term thinking - deals take longer but last longer

Key contacts and warm introductions are invaluable - they can cut sales cycles by 50%.`,
    metadata: { title: 'Middle East Sales Success', category: 'Sales' }
  }
]

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })
  return response.data[0].embedding
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start += chunkSize - overlap
    if (start + overlap >= text.length) break
  }

  return chunks
}

async function seedDemoKnowledge() {
  console.log('🚀 Starting demo knowledge seeding...\n')

  // Clear existing demo embeddings
  console.log('Clearing existing demo embeddings...')
  const demoContentIds = DEMO_KNOWLEDGE.map(k => k.id)
  const { error: deleteError } = await supabase
    .from('knowledge_embeddings')
    .delete()
    .in('content_id', demoContentIds)

  if (deleteError) {
    console.error('Error clearing existing embeddings:', deleteError)
  }

  let successCount = 0
  let errorCount = 0

  for (const content of DEMO_KNOWLEDGE) {
    console.log(`\n📄 Processing: ${content.metadata.title}`)

    try {
      const chunks = chunkText(content.text)
      console.log(`   Chunks: ${chunks.length}`)

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        console.log(`   Generating embedding for chunk ${i + 1}/${chunks.length}...`)

        const embedding = await generateEmbedding(chunk)

        const { error } = await supabase
          .from('knowledge_embeddings')
          .insert({
            org_id: ORG_ID,
            content_type: content.type,
            content_id: content.id,
            campaign_id: content.campaignId,
            chunk_text: chunk,
            chunk_index: i,
            metadata: content.metadata,
            embedding: embedding as unknown as string,
          })

        if (error) {
          console.error(`   ❌ Error inserting chunk ${i}:`, error.message)
          errorCount++
        } else {
          console.log(`   ✅ Chunk ${i + 1} inserted`)
          successCount++
        }
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${content.id}:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully inserted: ${successCount} chunks`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('='.repeat(50))
}

seedDemoKnowledge()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
