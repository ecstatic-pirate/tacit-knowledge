import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEmbeddings } from '@/lib/concierge'

// Demo knowledge content to seed (based on existing campaigns)
const DEMO_KNOWLEDGE = [
  {
    type: 'transcript' as const,
    id: 'demo-transcript-1',
    campaignId: 'c1111111-1111-1111-1111-111111111111', // Dr. Marcus Weber
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
    type: 'transcript' as const,
    id: 'demo-transcript-2',
    campaignId: '2bf4f52a-e52c-4c77-9ca1-3a2640e82fe8', // Raphael - Verify IT Lead
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
    type: 'transcript' as const,
    id: 'demo-transcript-3',
    campaignId: 'c3333333-3333-3333-3333-333333333333', // Lucas Brunner - AI Lead
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
    type: 'transcript' as const,
    id: 'demo-transcript-4',
    campaignId: 'e27227ee-80fc-4399-8138-96618f091f34', // Gabriel - Middle East
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
    type: 'insight' as const,
    id: 'demo-insight-1',
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
    type: 'insight' as const,
    id: 'demo-insight-2',
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
  }
]

export async function POST() {
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org_id
  const { data: appUser } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!appUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const results = []

  for (const content of DEMO_KNOWLEDGE) {
    try {
      await createEmbeddings(appUser.org_id, {
        type: content.type,
        id: content.id,
        campaignId: content.campaignId,
        text: content.text,
        metadata: content.metadata
      })
      results.push({ id: content.id, status: 'success' })
    } catch (error) {
      console.error(`Error creating embedding for ${content.id}:`, error)
      results.push({ id: content.id, status: 'error', error: String(error) })
    }
  }

  return NextResponse.json({
    message: 'Demo knowledge seeded',
    results
  })
}
