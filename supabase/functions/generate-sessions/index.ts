import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import OpenAI from "npm:openai";

// Types
interface AISessionPlan {
  sessionNumber: number;
  title: string;
  topics: string[]; // topic names
  estimatedMinutes: number;
}

interface Topic {
  id: string;
  name: string;
  category: string | null;
  captured: boolean;
}

// Initialize clients
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const MODEL = "gpt-5.2";

Deno.serve(async (req: Request) => {
  let campaignId: string | undefined;

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

    const payload = await req.json();
    campaignId = payload.campaignId;

    if (!campaignId) {
      return new Response(JSON.stringify({ error: "campaignId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Generating sessions for campaign: ${campaignId}`);

    // Set generation status to 'generating'
    await supabase
      .from("campaigns")
      .update({
        sessions_generation_status: "generating",
        sessions_generation_started_at: new Date().toISOString(),
        sessions_generation_error: null,
      })
      .eq("id", campaignId);

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, expert_name, expert_role, goal, session_duration, subject_type")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError);
      await supabase
        .from("campaigns")
        .update({
          sessions_generation_status: "failed",
          sessions_generation_error: "Campaign not found",
        })
        .eq("id", campaignId);
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch uncaptured topics
    const { data: topics } = await supabase
      .from("topics")
      .select("id, name, category, captured")
      .eq("campaign_id", campaignId)
      .eq("captured", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (!topics || topics.length === 0) {
      await supabase
        .from("campaigns")
        .update({
          sessions_generation_status: "completed",
          sessions_generation_error: null,
        })
        .eq("id", campaignId);
      return new Response(
        JSON.stringify({ success: true, sessionsCreated: 0, message: "No uncaptured topics to plan sessions for" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete existing AI-generated sessions that are still pending
    await supabase
      .from("sessions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("campaign_id", campaignId)
      .eq("status", "pending")
      .is("deleted_at", null);

    // Generate session plan with AI
    const sessionPlan = await generateSessionPlanWithAI(
      campaign,
      topics,
      campaign.session_duration || 30
    );

    if (!sessionPlan || sessionPlan.length === 0) {
      await supabase
        .from("campaigns")
        .update({
          sessions_generation_status: "failed",
          sessions_generation_error: "AI failed to generate session plan",
        })
        .eq("id", campaignId);
      return new Response(JSON.stringify({ error: "AI failed to generate session plan" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save sessions
    await saveSessions(campaignId, sessionPlan, topics);

    // Set generation status to 'completed'
    await supabase
      .from("campaigns")
      .update({
        sessions_generation_status: "completed",
        sessions_generation_error: null,
      })
      .eq("id", campaignId);

    console.log(`Generated ${sessionPlan.length} sessions`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionsCreated: sessionPlan.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-sessions:", error);

    if (campaignId) {
      await supabase
        .from("campaigns")
        .update({
          sessions_generation_status: "failed",
          sessions_generation_error: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", campaignId);
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
 * Generate session plan using AI
 */
async function generateSessionPlanWithAI(
  campaign: { expert_name: string; expert_role: string; goal: string | null; subject_type: string | null },
  topics: Topic[],
  sessionDuration: number
): Promise<AISessionPlan[] | null> {
  const topicsStr = topics
    .map((t) => `- ${t.name} (${t.category || "uncategorized"})`)
    .join("\n");

  const topicsPerSession = Math.floor(sessionDuration / 10); // ~10 min per topic average

  const prompt = `You are planning interview sessions for knowledge capture.

CAMPAIGN:
- Expert: ${campaign.expert_name} (${campaign.expert_role})
- Goal: ${campaign.goal || "Capture tacit knowledge"}
- Type: ${campaign.subject_type || "person"}

TOPICS TO COVER (${topics.length} total):
${topicsStr}

SESSION CONSTRAINTS:
- Target session duration: ${sessionDuration} minutes
- Each topic takes approximately 10 minutes to discuss
- Aim for ${topicsPerSession} topics per session (but can vary based on complexity)

YOUR TASK:
Create a session plan that:
1. Groups related topics together for natural conversation flow
2. Balances session lengths (staying close to ${sessionDuration} minutes each)
3. Orders sessions logically (foundational topics first, advanced later)
4. Gives each session a descriptive title

CRITICAL: In the "topics" array, you MUST use the EXACT topic names as provided above. Do NOT rephrase, shorten, combine, or modify the topic names in any way. Copy them exactly character-for-character.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "sessions": [
    {
      "sessionNumber": 1,
      "title": "Session Title - Brief Description",
      "topics": ["Exact Topic Name From List Above", "Another Exact Topic Name"],
      "estimatedMinutes": ${sessionDuration}
    }
  ]
}`;

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });

    const text = response.output_text || "";
    console.log("AI response:", text.slice(0, 500));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.sessions || [];
    }

    console.error("No JSON found in AI response");
    return null;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}

/**
 * Save sessions to database
 */
async function saveSessions(
  campaignId: string,
  sessionPlan: AISessionPlan[],
  topics: Topic[]
) {
  // Create a map of topic names to IDs (case-insensitive, trimmed)
  const topicNameToId = new Map<string, string>();
  const normalizedNameToOriginal = new Map<string, string>();

  topics.forEach((t) => {
    const normalized = t.name.toLowerCase().trim();
    topicNameToId.set(normalized, t.id);
    normalizedNameToOriginal.set(normalized, t.name);
    // Also add exact match
    topicNameToId.set(t.name, t.id);
  });

  // Helper to find topic ID with fuzzy matching
  const findTopicId = (name: string): string | undefined => {
    // Try exact match first
    if (topicNameToId.has(name)) return topicNameToId.get(name);

    // Try normalized match
    const normalized = name.toLowerCase().trim();
    if (topicNameToId.has(normalized)) return topicNameToId.get(normalized);

    // Try finding a topic that starts with or contains this name
    for (const [key, id] of topicNameToId.entries()) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return id;
      }
    }

    return undefined;
  };

  // Helper to find original topic name
  const findTopicName = (name: string): string => {
    const normalized = name.toLowerCase().trim();
    return normalizedNameToOriginal.get(normalized) || name;
  };

  // Get next session number
  const { data: existingSessions } = await supabase
    .from("sessions")
    .select("session_number")
    .eq("campaign_id", campaignId)
    .is("deleted_at", null)
    .order("session_number", { ascending: false })
    .limit(1);

  const nextSessionNumber =
    existingSessions && existingSessions.length > 0
      ? existingSessions[0].session_number + 1
      : 1;

  const sessionsToInsert = sessionPlan.map((session, index) => {
    const topicIds = session.topics
      .map((name) => findTopicId(name))
      .filter((id): id is string => id !== undefined);

    return {
      campaign_id: campaignId,
      session_number: nextSessionNumber + index,
      title: session.title,
      status: "pending",
      duration_minutes: session.estimatedMinutes,
      ai_suggested_topics: {
        topics: session.topics.map((name) => {
          const id = findTopicId(name);
          const originalName = findTopicName(name);
          return {
            name: originalName,
            id: id || null,
          };
        }),
      },
      topics: topicIds,
    };
  });

  const { error } = await supabase.from("sessions").insert(sessionsToInsert);

  if (error) {
    console.error("Error inserting sessions:", error);
    throw error;
  }

  // Update campaign total_sessions
  await supabase
    .from("campaigns")
    .update({ total_sessions: nextSessionNumber + sessionPlan.length - 1 })
    .eq("id", campaignId);
}
