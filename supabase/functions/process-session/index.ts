import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "npm:openai";

// =============================================================================
// Types
// =============================================================================

interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  timestamp_seconds: number;
  confidence: number | null;
}

interface Topic {
  id: string;
  name: string;
  category: string | null;
  captured: boolean;
}

interface Question {
  id: string;
  text: string;
  topic_id: string | null;
  asked: boolean;
}

interface Campaign {
  id: string;
  org_id: string;
  expert_name: string;
  expert_role: string;
  goal: string | null;
  subject_type: string;
}

interface Session {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string | null;
  status: string;
  processing_status: string;
}

interface ExtractedInsight {
  title: string;
  insight: string;
  confidence: number;
  relatedTopics?: string[];
}

interface TopicMatch {
  topic: string;
  confidence: number;
  coverageLevel: "mentioned" | "partial" | "full";
  context: string;
}

interface ExtractedEntity {
  name: string;
  type: "core" | "skill" | "system" | "process" | "concept";
  description: string;
  sourceInsightIndex?: number;
}

interface StepResult {
  success: boolean;
  error?: string;
  data?: unknown;
  metrics?: Record<string, number>;
}

interface ProcessingContext {
  sessionId: string;
  campaignId: string;
  orgId: string;
  session: Session;
  campaign: Campaign;
  transcriptLines: TranscriptLine[];
  transcript: string;
  topics: Topic[];
  questions: Question[];
}

interface ProcessingMetrics {
  totalDurationMs: number;
  stepDurations: Record<string, number>;
  insightsExtracted: number;
  topicsCaptured: number;
  questionsUpdated: number;
  nodesCreated: number;
  embeddingsCreated: number;
}

// =============================================================================
// Initialize clients
// =============================================================================

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Model constants
const MODEL_FAST = "gpt-5-mini";
const MODEL_STANDARD = "gpt-5.2";
const EMBEDDING_MODEL = "text-embedding-ada-002";

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  let sessionId: string | undefined;
  const startTime = Date.now();
  const metrics: ProcessingMetrics = {
    totalDurationMs: 0,
    stepDurations: {},
    insightsExtracted: 0,
    topicsCaptured: 0,
    questionsUpdated: 0,
    nodesCreated: 0,
    embeddingsCreated: 0,
  };
  const stepsCompleted: string[] = [];

  try {
    const payload = await req.json();
    sessionId = payload.sessionId;
    const force = payload.force || false;
    const skipSteps = payload.skipSteps || [];

    if (!sessionId) {
      return errorResponse("sessionId is required", 400);
    }

    console.log(`Processing session: ${sessionId}`);

    // ==========================================================================
    // Step 0: Fetch Context and Validate
    // ==========================================================================
    const stepStart = Date.now();

    // Check if already processed (unless force=true)
    const { data: existingSession, error: checkError } = await supabase
      .from("sessions")
      .select("processing_status, status")
      .eq("id", sessionId)
      .single();

    if (checkError || !existingSession) {
      return errorResponse("Session not found", 404);
    }

    if (existingSession.status !== "completed") {
      return errorResponse("Session is not completed yet", 400);
    }

    if (existingSession.processing_status === "completed" && !force) {
      return jsonResponse({
        success: true,
        message: "Already processed",
        skipped: true,
        sessionId,
      });
    }

    if (existingSession.processing_status === "processing") {
      return errorResponse("Session is already being processed", 409);
    }

    // Set status to processing
    await supabase
      .from("sessions")
      .update({
        processing_status: "processing",
        processing_started_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", sessionId);

    // Fetch full context
    const context = await fetchProcessingContext(sessionId);
    if (!context) {
      await markProcessingFailed(sessionId, "Failed to fetch session context");
      return errorResponse("Failed to fetch session context", 500);
    }

    metrics.stepDurations["fetch_context"] = Date.now() - stepStart;
    stepsCompleted.push("fetch_context");

    // ==========================================================================
    // Step 1: Extract Insights
    // ==========================================================================
    if (!skipSteps.includes("extract_insights")) {
      const result = await executeStep("extract_insights", async () => {
        return await extractInsights(context, metrics);
      }, metrics);

      if (result.success) {
        stepsCompleted.push("extract_insights");
      } else {
        console.error("Extract insights failed:", result.error);
      }
    }

    // ==========================================================================
    // Step 2: Match Topics
    // ==========================================================================
    if (!skipSteps.includes("match_topics")) {
      const result = await executeStep("match_topics", async () => {
        return await matchTopics(context, metrics);
      }, metrics);

      if (result.success) {
        stepsCompleted.push("match_topics");
      } else {
        console.error("Match topics failed:", result.error);
      }
    }

    // ==========================================================================
    // Step 3: Update Questions
    // ==========================================================================
    if (!skipSteps.includes("update_questions")) {
      const result = await executeStep("update_questions", async () => {
        return await updateQuestions(context, metrics);
      }, metrics);

      if (result.success) {
        stepsCompleted.push("update_questions");
      } else {
        console.error("Update questions failed:", result.error);
      }
    }

    // ==========================================================================
    // Step 4: Build Knowledge Graph
    // ==========================================================================
    if (!skipSteps.includes("build_graph")) {
      const result = await executeStep("build_graph", async () => {
        return await buildKnowledgeGraph(context, metrics);
      }, metrics);

      if (result.success) {
        stepsCompleted.push("build_graph");
      } else {
        console.error("Build graph failed:", result.error);
      }
    }

    // ==========================================================================
    // Step 5: Generate Embeddings
    // ==========================================================================
    if (!skipSteps.includes("generate_embeddings")) {
      const result = await executeStep("generate_embeddings", async () => {
        return await generateEmbeddings(context, metrics);
      }, metrics);

      if (result.success) {
        stepsCompleted.push("generate_embeddings");
      } else {
        console.error("Generate embeddings failed:", result.error);
      }
    }

    // ==========================================================================
    // Finalize
    // ==========================================================================
    metrics.totalDurationMs = Date.now() - startTime;

    const allStepsExpected = ["fetch_context", "extract_insights", "match_topics", "update_questions", "build_graph", "generate_embeddings"]
      .filter(s => !skipSteps.includes(s));

    const processingStatus = stepsCompleted.length === allStepsExpected.length
      ? "completed"
      : stepsCompleted.length > 1
        ? "partial"
        : "failed";

    await supabase
      .from("sessions")
      .update({
        processing_status: processingStatus,
        processing_completed_at: new Date().toISOString(),
        processing_steps_completed: stepsCompleted,
        processing_metrics: metrics,
      })
      .eq("id", sessionId);

    console.log(`Session ${sessionId} processing ${processingStatus}. Steps: ${stepsCompleted.join(", ")}`);

    return jsonResponse({
      success: true,
      sessionId,
      status: processingStatus,
      stepsCompleted,
      metrics,
    });

  } catch (error) {
    console.error("Error in process-session:", error);

    if (sessionId) {
      await markProcessingFailed(
        sessionId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

async function executeStep(
  stepName: string,
  stepFn: () => Promise<StepResult>,
  metrics: ProcessingMetrics
): Promise<StepResult> {
  const stepStart = Date.now();
  try {
    const result = await stepFn();
    metrics.stepDurations[stepName] = Date.now() - stepStart;
    return result;
  } catch (error) {
    metrics.stepDurations[stepName] = Date.now() - stepStart;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function fetchProcessingContext(sessionId: string): Promise<ProcessingContext | null> {
  // Fetch session with campaign
  const { data: sessionData, error: sessionError } = await supabase
    .from("sessions")
    .select(`
      *,
      campaigns (
        id,
        org_id,
        expert_name,
        expert_role,
        goal,
        subject_type
      )
    `)
    .eq("id", sessionId)
    .single();

  if (sessionError || !sessionData) {
    console.error("Error fetching session:", sessionError);
    return null;
  }

  const campaign = sessionData.campaigns as Campaign;
  if (!campaign) {
    console.error("Campaign not found for session");
    return null;
  }

  // Fetch transcript lines
  const { data: transcriptLines, error: transcriptError } = await supabase
    .from("transcript_lines")
    .select("id, speaker, text, timestamp_seconds, confidence")
    .eq("session_id", sessionId)
    .order("timestamp_seconds", { ascending: true });

  if (transcriptError) {
    console.error("Error fetching transcript:", transcriptError);
    return null;
  }

  if (!transcriptLines || transcriptLines.length === 0) {
    console.log("No transcript lines found for session");
    // Still return context, but with empty transcript
  }

  // Format transcript for AI
  const transcript = (transcriptLines || [])
    .map((line) => `${line.speaker}: ${line.text}`)
    .join("\n");

  // Fetch topics for campaign
  const { data: topics } = await supabase
    .from("topics")
    .select("id, name, category, captured")
    .eq("campaign_id", campaign.id)
    .is("deleted_at", null);

  // Fetch questions for campaign
  const { data: questions } = await supabase
    .from("questions")
    .select("id, text, topic_id, asked")
    .eq("campaign_id", campaign.id)
    .is("deleted_at", null);

  return {
    sessionId,
    campaignId: campaign.id,
    orgId: campaign.org_id,
    session: sessionData as Session,
    campaign,
    transcriptLines: transcriptLines || [],
    transcript,
    topics: topics || [],
    questions: questions || [],
  };
}

async function markProcessingFailed(sessionId: string, error: string): Promise<void> {
  await supabase
    .from("sessions")
    .update({
      processing_status: "failed",
      processing_error: error,
      processing_completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

// =============================================================================
// Step 1: Extract Insights
// =============================================================================

async function extractInsights(
  context: ProcessingContext,
  metrics: ProcessingMetrics
): Promise<StepResult> {
  if (!context.transcript || context.transcript.length < 50) {
    return { success: true, data: [], metrics: { insightsExtracted: 0 } };
  }

  const prompt = `You are an expert at extracting key insights from interview transcripts.

Analyze this interview transcript with ${context.campaign.expert_name} (${context.campaign.expert_role}) and extract the key insights - specific pieces of tacit knowledge that were captured.

Focus on:
- Undocumented processes or workarounds
- Decision rationale and reasoning
- Edge cases and gotchas
- Relationships and contacts
- Tips and best practices
- Systems and tools mentioned

Transcript:
${context.transcript.slice(0, 20000)}

Extract 5-15 distinct insights. Each insight should be a specific, actionable piece of knowledge.

Respond ONLY with valid JSON (no markdown):
{
  "insights": [
    {"title": "Short descriptive title", "insight": "Detailed insight description...", "confidence": 0.8, "relatedTopics": ["topic1", "topic2"]},
    ...
  ]
}`;

  try {
    const response = await openai.responses.create({
      model: MODEL_STANDARD,
      input: prompt,
    });

    const text = response.output_text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { success: false, error: "No JSON found in AI response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const insights: ExtractedInsight[] = parsed.insights || [];

    if (insights.length === 0) {
      return { success: true, data: [], metrics: { insightsExtracted: 0 } };
    }

    // Save insights to database
    const insightsToInsert = insights.map((insight) => ({
      session_id: context.sessionId,
      campaign_id: context.campaignId,
      title: insight.title,
      insight: insight.insight,
      confidence: insight.confidence,
      metadata: {
        relatedTopics: insight.relatedTopics || [],
        extractedBy: "ai",
        model: MODEL_STANDARD,
      },
    }));

    const { data: insertedInsights, error: insertError } = await supabase
      .from("captured_insights")
      .insert(insightsToInsert)
      .select("id");

    if (insertError) {
      console.error("Error inserting insights:", insertError);
      return { success: false, error: insertError.message };
    }

    metrics.insightsExtracted = insertedInsights?.length || 0;
    console.log(`Extracted ${metrics.insightsExtracted} insights`);

    return {
      success: true,
      data: insertedInsights,
      metrics: { insightsExtracted: metrics.insightsExtracted },
    };
  } catch (error) {
    console.error("Error extracting insights:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Step 2: Match Topics
// =============================================================================

async function matchTopics(
  context: ProcessingContext,
  metrics: ProcessingMetrics
): Promise<StepResult> {
  if (!context.transcript || context.topics.length === 0) {
    return { success: true, data: [], metrics: { topicsCaptured: 0 } };
  }

  const topicNames = context.topics.map((t) => t.name);

  const prompt = `You are analyzing an interview transcript to assess how thoroughly specific topics were covered.

Expert interviewed: ${context.campaign.expert_name} (${context.campaign.expert_role})

Topics we're looking for:
${topicNames.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Transcript:
${context.transcript.slice(0, 15000)}

For each topic that was discussed, assess the coverage level:
- "mentioned": Topic was briefly touched on (1-2 exchanges, name-dropped without detail)
- "partial": Topic was discussed moderately (3-5 exchanges, some explanation but not comprehensive)
- "full": Topic was thoroughly covered (5+ exchanges with actionable details, examples, or deep explanation)

Be conservative - only include topics with clear evidence in the transcript.
Do NOT include topics that weren't discussed at all.

Respond ONLY with valid JSON (no markdown):
{
  "topicsMentioned": [
    {"topic": "exact topic name from list", "confidence": 0.8, "coverageLevel": "mentioned|partial|full", "context": "brief quote or summary from transcript"},
    ...
  ]
}`;

  try {
    const response = await openai.responses.create({
      model: MODEL_FAST,
      input: prompt,
    });

    const text = response.output_text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { success: false, error: "No JSON found in AI response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const matches: TopicMatch[] = parsed.topicsMentioned || [];

    // Filter by confidence threshold (lowered to catch mentions)
    const relevantMatches = matches.filter((m) => m.confidence >= 0.5);

    if (relevantMatches.length === 0) {
      return { success: true, data: [], metrics: { topicsCaptured: 0 } };
    }

    // Process each match: create knowledge node and link via junction table
    const processedTopics: string[] = [];
    let coverageRecordsCreated = 0;

    for (const match of relevantMatches) {
      const topic = context.topics.find(
        (t) => t.name.toLowerCase() === match.topic.toLowerCase()
      );

      if (!topic) {
        console.log(`Topic not found: ${match.topic}`);
        continue;
      }

      // Validate coverage level
      const coverageLevel = ["mentioned", "partial", "full"].includes(match.coverageLevel)
        ? match.coverageLevel
        : "mentioned";

      // Create a knowledge node for this topic discussion
      const { data: node, error: nodeError } = await supabase
        .from("graph_nodes")
        .insert({
          campaign_id: context.campaignId,
          session_id: context.sessionId,
          type: "concept",
          label: `${topic.name} (Session ${context.session.session_number})`,
          description: match.context,
          coverage_status: coverageLevel === "full" ? "covered" : coverageLevel,
          topic_id: topic.id,
          metadata: {
            source: "session_processing",
            aiConfidence: match.confidence,
            coverageLevel: coverageLevel,
          },
        })
        .select("id")
        .single();

      if (nodeError) {
        console.error(`Error creating graph node for topic ${topic.name}:`, nodeError);
        continue;
      }

      if (node) {
        // Insert into junction table - this triggers the coverage update
        const { error: coverageError } = await supabase
          .from("knowledge_topic_coverage")
          .insert({
            topic_id: topic.id,
            knowledge_node_id: node.id,
            session_id: context.sessionId,
            coverage_level: coverageLevel,
          });

        if (coverageError) {
          console.error(`Error creating coverage record for topic ${topic.name}:`, coverageError);
        } else {
          coverageRecordsCreated++;
          processedTopics.push(topic.name);
        }
      }
    }

    metrics.topicsCaptured = coverageRecordsCreated;
    console.log(`Created ${coverageRecordsCreated} topic coverage records for: ${processedTopics.join(", ")}`);

    return {
      success: true,
      data: { processedTopics, coverageRecordsCreated },
      metrics: { topicsCaptured: coverageRecordsCreated },
    };
  } catch (error) {
    console.error("Error matching topics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Step 3: Update Questions
// =============================================================================

async function updateQuestions(
  context: ProcessingContext,
  metrics: ProcessingMetrics
): Promise<StepResult> {
  if (!context.transcript || context.questions.length === 0) {
    return { success: true, data: { updated: 0, created: 0 } };
  }

  const unansweredQuestions = context.questions.filter((q) => !q.asked);
  if (unansweredQuestions.length === 0) {
    return { success: true, data: { updated: 0, created: 0 } };
  }

  const prompt = `You are analyzing an interview transcript to determine which questions were answered.

Expert: ${context.campaign.expert_name} (${context.campaign.expert_role})

Questions to check:
${unansweredQuestions.map((q, i) => `${i + 1}. [ID:${q.id}] ${q.text}`).join("\n")}

Transcript:
${context.transcript.slice(0, 15000)}

Analyze which questions were answered (even partially) in the transcript.
Also suggest 2-3 follow-up questions based on what was discussed.

Respond ONLY with valid JSON (no markdown):
{
  "questionsAnswered": [
    {"id": "question-id", "confidence": 0.8},
    ...
  ],
  "followUpQuestions": [
    {"question": "Follow-up question text", "relatedToQuestionId": "optional-question-id", "priority": "high|medium|low"},
    ...
  ]
}`;

  try {
    const response = await openai.responses.create({
      model: MODEL_FAST,
      input: prompt,
    });

    const text = response.output_text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { success: false, error: "No JSON found in AI response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const answeredQuestions = parsed.questionsAnswered || [];
    const followUps = parsed.followUpQuestions || [];

    let updatedCount = 0;
    let createdCount = 0;

    // Mark questions as asked
    const answeredIds = answeredQuestions
      .filter((q: { confidence: number }) => q.confidence >= 0.6)
      .map((q: { id: string }) => q.id);

    if (answeredIds.length > 0) {
      const { error: updateError } = await supabase
        .from("questions")
        .update({
          asked: true,
          asked_in_session_id: context.sessionId,
          asked_at: new Date().toISOString(),
        })
        .in("id", answeredIds);

      if (!updateError) {
        updatedCount = answeredIds.length;
      }
    }

    // Create follow-up questions
    if (followUps.length > 0) {
      const followUpsToInsert = followUps.slice(0, 3).map((fu: {
        question: string;
        relatedToQuestionId?: string;
        priority?: string;
      }) => ({
        campaign_id: context.campaignId,
        text: fu.question,
        source: "follow_up",
        priority: fu.priority || "medium",
        asked: false,
      }));

      const { data: insertedFollowUps, error: insertError } = await supabase
        .from("questions")
        .insert(followUpsToInsert)
        .select("id");

      if (!insertError && insertedFollowUps) {
        createdCount = insertedFollowUps.length;
      }
    }

    metrics.questionsUpdated = updatedCount;
    console.log(`Updated ${updatedCount} questions, created ${createdCount} follow-ups`);

    return {
      success: true,
      data: { updated: updatedCount, created: createdCount },
    };
  } catch (error) {
    console.error("Error updating questions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Step 4: Build Knowledge Graph
// =============================================================================

async function buildKnowledgeGraph(
  context: ProcessingContext,
  metrics: ProcessingMetrics
): Promise<StepResult> {
  if (!context.transcript || context.transcript.length < 100) {
    return { success: true, data: { nodesCreated: 0 } };
  }

  const prompt = `You are extracting entities and concepts from an interview transcript to build a knowledge graph.

Expert: ${context.campaign.expert_name} (${context.campaign.expert_role})
Goal: ${context.campaign.goal || "Capture tacit knowledge"}

Transcript:
${context.transcript.slice(0, 15000)}

Extract key entities mentioned in this interview:
- Core entities (key people, teams, important stakeholders)
- Skills (capabilities, expertise areas)
- Systems (software, platforms, tools)
- Processes (workflows, procedures)
- Concepts (ideas, principles, patterns)

For each entity, provide:
- A clear name/label
- Type: one of "core", "skill", "system", "process", or "concept"
- Brief description of what it is or why it's important

Respond ONLY with valid JSON (no markdown):
{
  "entities": [
    {"name": "Entity Name", "type": "core|skill|system|process|concept", "description": "Brief description..."},
    ...
  ]
}`;

  try {
    const response = await openai.responses.create({
      model: MODEL_FAST,
      input: prompt,
    });

    const text = response.output_text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { success: false, error: "No JSON found in AI response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const entities: ExtractedEntity[] = parsed.entities || [];

    if (entities.length === 0) {
      return { success: true, data: { nodesCreated: 0 } };
    }

    // Create graph nodes
    const nodesToInsert = entities.slice(0, 20).map((entity) => ({
      campaign_id: context.campaignId,
      session_id: context.sessionId,
      type: entity.type,
      label: entity.name,
      description: entity.description,
      coverage_status: "covered",
      metadata: {
        source: "transcript",
        extractedBy: "ai",
      },
    }));

    const { data: insertedNodes, error: insertError } = await supabase
      .from("graph_nodes")
      .insert(nodesToInsert)
      .select("id");

    if (insertError) {
      console.error("Error inserting graph nodes:", insertError);
      return { success: false, error: insertError.message };
    }

    metrics.nodesCreated = insertedNodes?.length || 0;
    console.log(`Created ${metrics.nodesCreated} graph nodes`);

    return {
      success: true,
      data: { nodesCreated: metrics.nodesCreated },
    };
  } catch (error) {
    console.error("Error building knowledge graph:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =============================================================================
// Step 5: Generate Embeddings
// =============================================================================

async function generateEmbeddings(
  context: ProcessingContext,
  metrics: ProcessingMetrics
): Promise<StepResult> {
  if (!context.transcript || context.transcript.length < 50) {
    return { success: true, data: { embeddingsCreated: 0 } };
  }

  try {
    // Chunk the transcript
    const chunks = chunkText(context.transcript, 1000, 200);

    if (chunks.length === 0) {
      return { success: true, data: { embeddingsCreated: 0 } };
    }

    // Generate embeddings in batches
    const embeddings: number[][] = [];
    const batchSize = 20;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      });

      for (const item of response.data) {
        embeddings.push(item.embedding);
      }
    }

    // Delete existing embeddings for this session's transcript
    await supabase
      .from("knowledge_embeddings")
      .delete()
      .eq("content_id", context.sessionId)
      .eq("content_type", "transcript");

    // Insert new embeddings
    const embeddingRecords = chunks.map((chunk, index) => ({
      org_id: context.orgId,
      content_type: "transcript",
      content_id: context.sessionId,
      campaign_id: context.campaignId,
      chunk_text: chunk,
      chunk_index: index,
      metadata: {
        sessionNumber: context.session.session_number,
        sessionTitle: context.session.title,
        expertName: context.campaign.expert_name,
      },
      embedding: embeddings[index] as unknown as string,
    }));

    const { error: insertError } = await supabase
      .from("knowledge_embeddings")
      .insert(embeddingRecords);

    if (insertError) {
      console.error("Error inserting embeddings:", insertError);
      return { success: false, error: insertError.message };
    }

    metrics.embeddingsCreated = embeddingRecords.length;
    console.log(`Created ${metrics.embeddingsCreated} embeddings`);

    return {
      success: true,
      data: { embeddingsCreated: metrics.embeddingsCreated },
    };
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Simple text chunking with overlap
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;

    // Avoid creating tiny final chunks
    if (text.length - start < chunkSize / 2) {
      if (chunks.length > 0 && start < text.length) {
        chunks[chunks.length - 1] = text.slice(start - (chunkSize - overlap));
      }
      break;
    }
  }

  return chunks;
}
