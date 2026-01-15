import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import OpenAI from "npm:openai";

// Types for webhook payload
interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

// Types for AI response
interface AITopicSuggestion {
  name: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface AITopicUpdate {
  id: string;
  name?: string;
  category?: string;
}

interface AIQuestion {
  topicName: string;
  text: string;
  priority: "high" | "medium" | "low";
  category: string;
}

interface AISessionPlan {
  sessionNumber: number;
  title: string;
  topics: string[]; // topic names
  estimatedMinutes: number;
}

interface AIResponse {
  newTopics: AITopicSuggestion[];
  topicUpdates: AITopicUpdate[];
  questions: AIQuestion[];
  sessionPlan?: AISessionPlan[];
}

// Initialize clients
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Model to use
const MODEL = "gpt-5.2";

Deno.serve(async (req: Request) => {
  try {
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

    const payload: WebhookPayload | { campaignId: string } = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));

    let campaignId: string;
    let triggerSource: string;

    // Handle manual trigger (has campaignId directly)
    if ("campaignId" in payload) {
      campaignId = payload.campaignId;
      triggerSource = "manual";
      console.log(`Manual trigger for campaign: ${campaignId}`);
    }
    // Handle webhook trigger
    else {
      const webhookPayload = payload as WebhookPayload;
      const result = extractCampaignId(webhookPayload);

      if (!result) {
        console.log("Skipping - not a relevant trigger");
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      campaignId = result.campaignId;
      triggerSource = result.source;
    }

    console.log(`Processing campaign ${campaignId} from ${triggerSource}`);

    // Set generation status to 'generating'
    await supabase
      .from("campaigns")
      .update({
        topics_generation_status: "generating",
        topics_generation_started_at: new Date().toISOString(),
        topics_generation_error: null,
      })
      .eq("id", campaignId);

    // Fetch all campaign context
    const context = await fetchCampaignContext(campaignId);
    if (!context) {
      console.error("Campaign not found:", campaignId);
      await supabase
        .from("campaigns")
        .update({
          topics_generation_status: "failed",
          topics_generation_error: "Campaign not found",
        })
        .eq("id", campaignId);
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch existing topics
    const existingTopics = await fetchExistingTopics(campaignId);

    // Generate topics and questions with AI
    const aiResult = await generateTopicsWithAI(context, existingTopics, triggerSource);

    if (!aiResult) {
      console.error("AI generation failed");
      await supabase
        .from("campaigns")
        .update({
          topics_generation_status: "failed",
          topics_generation_error: "AI generation failed",
        })
        .eq("id", campaignId);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save results to database
    const savedTopics = await saveTopics(campaignId, aiResult.newTopics, triggerSource);
    await updateTopics(aiResult.topicUpdates);
    await saveQuestions(campaignId, aiResult.questions, savedTopics, existingTopics, triggerSource);

    // Save session plan if provided
    if (aiResult.sessionPlan && aiResult.sessionPlan.length > 0) {
      await saveSessions(campaignId, aiResult.sessionPlan, savedTopics, existingTopics);
    }

    console.log(`Generated ${aiResult.newTopics.length} topics, ${aiResult.questions.length} questions, and ${aiResult.sessionPlan?.length || 0} sessions`);

    // Set generation status to 'completed'
    await supabase
      .from("campaigns")
      .update({
        topics_generation_status: "completed",
        topics_generation_error: null,
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        topicsCreated: aiResult.newTopics.length,
        topicsUpdated: aiResult.topicUpdates.length,
        questionsCreated: aiResult.questions.length,
        sessionsCreated: aiResult.sessionPlan?.length || 0,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-topics:", error);

    // Try to update status to failed (campaignId might not be defined if error was early)
    try {
      const payload = await req.clone().json();
      const errorCampaignId = payload.campaignId || payload.record?.campaign_id;
      if (errorCampaignId) {
        await supabase
          .from("campaigns")
          .update({
            topics_generation_status: "failed",
            topics_generation_error: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", errorCampaignId);
      }
    } catch {
      // Ignore errors in error handling
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Extract campaign ID from webhook payload and determine if we should process
 */
function extractCampaignId(
  payload: WebhookPayload
): { campaignId: string; source: string } | null {
  const { table, type, record, old_record } = payload;

  // Expert self-assessment submitted
  if (table === "campaign_access_tokens" && type === "UPDATE") {
    const wasNotSubmitted = !old_record?.submitted_at;
    const isNowSubmitted = !!record.submitted_at;
    const isExpert = record.token_type === "expert";

    if (wasNotSubmitted && isNowSubmitted && isExpert) {
      return {
        campaignId: record.campaign_id as string,
        source: "expert_self_assessment",
      };
    }
  }

  // Collaborator feedback submitted
  if (table === "collaborator_responses" && type === "INSERT") {
    return {
      campaignId: record.campaign_id as string,
      source: "collaborator_feedback",
    };
  }

  // Document processed
  if (table === "documents" && type === "UPDATE") {
    const wasNotProcessed = old_record?.ai_processed !== true;
    const isNowProcessed = record.ai_processed === true;

    if (wasNotProcessed && isNowProcessed) {
      return {
        campaignId: record.campaign_id as string,
        source: "document_analysis",
      };
    }
  }

  return null;
}

/**
 * Fetch all context for a campaign
 */
async function fetchCampaignContext(campaignId: string) {
  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    console.error("Error fetching campaign:", campaignError);
    return null;
  }

  // Fetch collaborator responses
  const { data: responses } = await supabase
    .from("collaborator_responses")
    .select("*")
    .eq("campaign_id", campaignId);

  // Fetch processed documents
  const { data: documents } = await supabase
    .from("documents")
    .select("filename, ai_analysis")
    .eq("campaign_id", campaignId)
    .eq("ai_processed", true)
    .is("deleted_at", null);

  return {
    campaign,
    selfAssessment: campaign.self_assessment as Record<string, unknown> | null,
    collaboratorResponses: responses || [],
    documents: documents || [],
    sessionDuration: (campaign.session_duration as number) || 30,
  };
}

/**
 * Fetch existing topics for a campaign
 */
async function fetchExistingTopics(campaignId: string) {
  const { data: topics } = await supabase
    .from("topics")
    .select("id, name, category, suggested_by")
    .eq("campaign_id", campaignId)
    .is("deleted_at", null);

  return topics || [];
}

/**
 * Generate topics and questions using GPT-5.2
 */
async function generateTopicsWithAI(
  context: {
    campaign: Record<string, unknown>;
    selfAssessment: Record<string, unknown> | null;
    collaboratorResponses: Record<string, unknown>[];
    documents: { filename: string; ai_analysis: unknown }[];
    sessionDuration: number;
  },
  existingTopics: { id: string; name: string; category: string | null; suggested_by: string | null }[],
  triggerSource: string
): Promise<AIResponse | null> {
  const { campaign, selfAssessment, collaboratorResponses, documents, sessionDuration } = context;

  // Build context strings
  const existingTopicsStr = existingTopics.length > 0
    ? existingTopics.map((t) => `- ${t.name} (${t.category || "uncategorized"})`).join("\n")
    : "None yet";

  const selfAssessmentStr = selfAssessment
    ? `
What they know: ${(selfAssessment.what_you_know as string[])?.join(", ") || "Not provided"}
Topics they want to cover: ${(selfAssessment.topics_to_cover as string[])?.join(", ") || "Not provided"}
What will break without them: ${(selfAssessment.what_will_break as string[])?.join(", ") || "Not provided"}
Questions people ask: ${(selfAssessment.questions_people_ask as string[])?.join(", ") || "Not provided"}
`
    : "Not submitted yet";

  const collaboratorStr = collaboratorResponses.length > 0
    ? collaboratorResponses
        .map(
          (r) => `
${r.collaborator_name} (${r.collaborator_role}):
- Asks about: ${(r.what_they_ask_about as string[])?.join(", ") || "N/A"}
- What will be hard: ${r.what_will_be_hard || "N/A"}
- Wishes documented: ${r.wish_was_documented || "N/A"}
- Specific questions: ${(r.specific_questions as string[])?.join(", ") || "N/A"}
`
        )
        .join("\n")
    : "No collaborator feedback yet";

  const documentsStr = documents.length > 0
    ? documents
        .map((d) => {
          const analysis = d.ai_analysis as { summary?: string; topics?: string[] } | null;
          return `- ${d.filename}: ${analysis?.summary || "No summary"} (Topics: ${analysis?.topics?.join(", ") || "None"})`;
        })
        .join("\n")
    : "No documents processed yet";

  const prompt = `You are an AI assistant helping to identify knowledge topics and interview questions for a knowledge capture campaign.

CAMPAIGN CONTEXT:
- Expert: ${campaign.expert_name} (${campaign.expert_role})
- Goal: ${campaign.goal || "Capture tacit knowledge"}
- Type: ${campaign.subject_type || "person"}

EXISTING TOPICS (do not duplicate these):
${existingTopicsStr}

EXPERT SELF-ASSESSMENT:
${selfAssessmentStr}

COLLABORATOR FEEDBACK:
${collaboratorStr}

PROCESSED DOCUMENTS:
${documentsStr}

TRIGGER: This was triggered by: ${triggerSource}

YOUR TASK:
1. Identify NEW topics not already in the existing list. Topics should be:
   - Granular enough to cover in 15-30 minutes of discussion
   - Specific (e.g., "RLS multi-tenant isolation" not "Security")
   - Actionable for knowledge capture

2. Suggest updates to existing topics only if the new information significantly changes understanding

3. Generate 2-3 interview questions for each NEW topic. Questions should:
   - Focus on "why" and "how" not just "what"
   - Probe for undocumented knowledge, edge cases, and decision rationale
   - Be specific and actionable

CATEGORIES for topics: "architecture", "process", "integration", "operations", "relationships", "decision_rationale", "edge_cases", "tools", "domain_knowledge"

QUESTION CATEGORIES: "process", "decision", "edge_case", "relationship", "handoff", "troubleshooting"

SESSION PLANNING:
- Target session duration: ${sessionDuration} minutes
- Assume each topic takes 15-20 minutes to discuss in depth
- Group related topics into sessions for natural flow
- High-priority topics should be in earlier sessions
- Create sessions numbered sequentially (1, 2, 3...)
- Each session should have a descriptive title

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "newTopics": [
    { "name": "Topic Name", "category": "architecture", "priority": "high" }
  ],
  "topicUpdates": [
    { "id": "existing-topic-uuid", "name": "Updated Name If Needed", "category": "new-category-if-needed" }
  ],
  "questions": [
    { "topicName": "Topic Name", "text": "What is the question?", "priority": "high", "category": "process" }
  ],
  "sessionPlan": [
    { "sessionNumber": 1, "title": "Session Title", "topics": ["Topic Name 1", "Topic Name 2"], "estimatedMinutes": ${sessionDuration} }
  ]
}`;

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });

    const text = response.output_text || "";
    console.log("AI response:", text.slice(0, 500));

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AIResponse;
      return {
        newTopics: parsed.newTopics || [],
        topicUpdates: parsed.topicUpdates || [],
        questions: parsed.questions || [],
        sessionPlan: parsed.sessionPlan || [],
      };
    }

    console.error("No JSON found in AI response");
    return null;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}

/**
 * Save new topics to database
 */
async function saveTopics(
  campaignId: string,
  topics: AITopicSuggestion[],
  source: string
): Promise<Map<string, string>> {
  const topicNameToId = new Map<string, string>();

  if (topics.length === 0) return topicNameToId;

  const topicsToInsert = topics.map((t) => ({
    campaign_id: campaignId,
    name: t.name,
    category: t.category,
    suggested_by: "ai",
    source: source,
    captured: false,
  }));

  const { data, error } = await supabase
    .from("topics")
    .insert(topicsToInsert)
    .select("id, name");

  if (error) {
    console.error("Error inserting topics:", error);
  } else if (data) {
    data.forEach((t) => topicNameToId.set(t.name, t.id));
  }

  return topicNameToId;
}

/**
 * Update existing topics
 */
async function updateTopics(updates: AITopicUpdate[]) {
  for (const update of updates) {
    if (!update.id) continue;

    const updateData: Record<string, unknown> = {};
    if (update.name) updateData.name = update.name;
    if (update.category) updateData.category = update.category;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("topics")
        .update(updateData)
        .eq("id", update.id);

      if (error) {
        console.error(`Error updating topic ${update.id}:`, error);
      }
    }
  }
}

/**
 * Save questions to database
 */
async function saveQuestions(
  campaignId: string,
  questions: AIQuestion[],
  newTopicIds: Map<string, string>,
  existingTopics: { id: string; name: string }[],
  source: string
) {
  if (questions.length === 0) return;

  // Create a map of all topic names to IDs
  const allTopicIds = new Map<string, string>(newTopicIds);
  existingTopics.forEach((t) => allTopicIds.set(t.name, t.id));

  const questionsToInsert = questions.map((q) => ({
    campaign_id: campaignId,
    topic_id: allTopicIds.get(q.topicName) || null,
    text: q.text,
    source: source,
    priority: q.priority,
    category: q.category,
    asked: false,
  }));

  const { error } = await supabase.from("questions").insert(questionsToInsert);

  if (error) {
    console.error("Error inserting questions:", error);
  }
}

/**
 * Save AI-planned sessions to database
 */
async function saveSessions(
  campaignId: string,
  sessionPlan: AISessionPlan[],
  newTopicIds: Map<string, string>,
  existingTopics: { id: string; name: string }[]
) {
  if (sessionPlan.length === 0) return;

  // Create a map of all topic names to IDs
  const allTopicIds = new Map<string, string>(newTopicIds);
  existingTopics.forEach((t) => allTopicIds.set(t.name, t.id));

  // Check for existing sessions to get the next session number
  const { data: existingSessions } = await supabase
    .from("sessions")
    .select("session_number")
    .eq("campaign_id", campaignId)
    .is("deleted_at", null)
    .order("session_number", { ascending: false })
    .limit(1);

  const nextSessionNumber = existingSessions && existingSessions.length > 0
    ? existingSessions[0].session_number + 1
    : 1;

  const sessionsToInsert = sessionPlan.map((session, index) => {
    // Map topic names to IDs
    const topicIds = session.topics
      .map((topicName) => allTopicIds.get(topicName))
      .filter((id): id is string => id !== undefined);

    return {
      campaign_id: campaignId,
      session_number: nextSessionNumber + index,
      title: session.title,
      status: "pending",
      duration_minutes: session.estimatedMinutes,
      ai_suggested_topics: {
        topics: session.topics.map((topicName) => ({
          name: topicName,
          id: allTopicIds.get(topicName) || null,
        })),
      },
      topics: topicIds,
    };
  });

  const { error } = await supabase.from("sessions").insert(sessionsToInsert);

  if (error) {
    console.error("Error inserting sessions:", error);
  } else {
    // Update campaign total_sessions count
    await supabase
      .from("campaigns")
      .update({ total_sessions: nextSessionNumber + sessionPlan.length - 1 })
      .eq("id", campaignId);
  }
}
