import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "npm:openai";

// =============================================================================
// Types
// =============================================================================

interface ReportTemplate {
  type: string;
  name: string;
  prompt_template: string;
  sections: unknown[];
  requires_campaign: boolean;
  requires_session: boolean;
}

interface Campaign {
  id: string;
  org_id: string;
  expert_name: string;
  expert_role: string;
  goal: string | null;
  created_at: string;
  completed_sessions: number | null;
  total_sessions: number | null;
}

interface Session {
  id: string;
  campaign_id: string;
  session_number: number;
  status: string;
  scheduled_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

interface Topic {
  id: string;
  name: string;
  category: string | null;
  captured: boolean;
  coverage_status: string | null;
}

interface Insight {
  id: string;
  title: string;
  insight: string;
  confidence: number | null;
  session_id: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  description: string | null;
  coverage_status: string | null;
}

interface GenerateReportPayload {
  templateType: string;
  campaignId?: string;
  sessionId?: string;
  scheduleId?: string;
  orgId: string;
  userId?: string;
  timePeriod?: string;
}

interface ReportContext {
  template: ReportTemplate;
  campaign: Campaign | null;
  session: Session | null;
  sessions: Session[];
  topics: Topic[];
  insights: Insight[];
  graphNodes: GraphNode[];
  orgId: string;
}

// =============================================================================
// Initialize clients
// =============================================================================

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const MODEL = "gpt-5.2";

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

  const startTime = Date.now();
  let reportId: string | undefined;

  try {
    const payload: GenerateReportPayload = await req.json();
    const { templateType, campaignId, sessionId, scheduleId, orgId, userId, timePeriod } = payload;

    if (!templateType || !orgId) {
      return errorResponse("templateType and orgId are required", 400);
    }

    console.log(`Generating report: type=${templateType}, campaign=${campaignId}, session=${sessionId}`);

    // ==========================================================================
    // Step 1: Fetch template
    // ==========================================================================
    const { data: template, error: templateError } = await supabase
      .from("report_templates")
      .select("*")
      .eq("type", templateType)
      .is("deleted_at", null)
      .single();

    if (templateError || !template) {
      return errorResponse(`Template not found: ${templateType}`, 404);
    }

    // Validate requirements
    if (template.requires_session && !sessionId) {
      return errorResponse("This report type requires a sessionId", 400);
    }

    if (template.requires_campaign && !campaignId) {
      return errorResponse("This report type requires a campaignId", 400);
    }

    // ==========================================================================
    // Step 2: Create pending report record
    // ==========================================================================
    const reportTitle = generateReportTitle(template, campaignId ? await fetchCampaignName(campaignId) : undefined);

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        org_id: orgId,
        campaign_id: campaignId || null,
        session_id: sessionId || null,
        template_type: templateType,
        schedule_id: scheduleId || null,
        title: reportTitle,
        type: templateType,
        status: "generating",
        created_by: userId || null,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (reportError || !report) {
      console.error("Error creating report record:", reportError);
      return errorResponse("Failed to create report record", 500);
    }

    reportId = report.id;
    console.log(`Created report record: ${reportId}`);

    // ==========================================================================
    // Step 3: Fetch context data
    // ==========================================================================
    const context = await fetchReportContext(template, campaignId, sessionId, orgId);

    // ==========================================================================
    // Step 4: Build prompt and generate content
    // ==========================================================================
    const prompt = buildPrompt(template, context, timePeriod);

    console.log(`Generating content with ${MODEL}...`);
    const response = await openai.responses.create({
      model: MODEL,
      input: prompt,
    });

    const contentMarkdown = response.output_text || "";

    if (!contentMarkdown || contentMarkdown.length < 100) {
      throw new Error("Generated content is too short or empty");
    }

    // Convert markdown to simple HTML
    const contentHtml = markdownToHtml(contentMarkdown);

    // Generate preview (first 300 chars of content)
    const preview = contentMarkdown
      .replace(/^#.*$/gm, "")
      .replace(/\n+/g, " ")
      .trim()
      .substring(0, 300);

    // ==========================================================================
    // Step 5: Update report with generated content
    // ==========================================================================
    const generationDurationMs = Date.now() - startTime;

    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "completed",
        content_markdown: contentMarkdown,
        content_html: contentHtml,
        preview: preview,
        generation_duration_ms: generationDurationMs,
        metadata: {
          model: MODEL,
          promptTokens: prompt.length,
          responseTokens: contentMarkdown.length,
          context: {
            campaignId,
            sessionId,
            topicsCount: context.topics.length,
            insightsCount: context.insights.length,
            sessionsCount: context.sessions.length,
          },
        },
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("Error updating report:", updateError);
      throw new Error("Failed to save generated content");
    }

    // ==========================================================================
    // Step 6: Update schedule if this was a scheduled report
    // ==========================================================================
    if (scheduleId) {
      await supabase
        .from("report_schedules")
        .update({
          last_run_at: new Date().toISOString(),
          last_report_id: reportId,
          run_count: supabase.rpc("increment", { row_id: scheduleId, table_name: "report_schedules", column_name: "run_count" }),
        })
        .eq("id", scheduleId);
    }

    console.log(`Report generated successfully: ${reportId} (${generationDurationMs}ms)`);

    return jsonResponse({
      success: true,
      reportId,
      title: reportTitle,
      preview,
      generationDurationMs,
    });

  } catch (error) {
    console.error("Error generating report:", error);

    // Mark report as failed if we created one
    if (reportId) {
      await supabase
        .from("reports")
        .update({
          status: "failed",
          generation_error: error instanceof Error ? error.message : "Unknown error",
          generation_duration_ms: Date.now() - startTime,
        })
        .eq("id", reportId);
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

async function fetchCampaignName(campaignId: string): Promise<string | undefined> {
  const { data } = await supabase
    .from("campaigns")
    .select("expert_name")
    .eq("id", campaignId)
    .single();
  return data?.expert_name;
}

function generateReportTitle(template: ReportTemplate, campaignName?: string): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (campaignName) {
    return `${template.name} - ${campaignName} (${date})`;
  }
  return `${template.name} (${date})`;
}

async function fetchReportContext(
  template: ReportTemplate,
  campaignId: string | undefined,
  sessionId: string | undefined,
  orgId: string
): Promise<ReportContext> {
  const context: ReportContext = {
    template,
    campaign: null,
    session: null,
    sessions: [],
    topics: [],
    insights: [],
    graphNodes: [],
    orgId,
  };

  // Fetch campaign if needed
  if (campaignId) {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, org_id, expert_name, expert_role, goal, created_at, completed_sessions, total_sessions")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      context.campaign = campaign;

      // Fetch sessions for this campaign
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, campaign_id, session_number, status, scheduled_at, ended_at, duration_minutes, notes")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("session_number", { ascending: true });

      context.sessions = sessions || [];

      // Fetch topics for this campaign
      const { data: topics } = await supabase
        .from("topics")
        .select("id, name, category, captured, coverage_status")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      context.topics = topics || [];

      // Fetch insights for this campaign
      const { data: insights } = await supabase
        .from("captured_insights")
        .select("id, title, insight, confidence, session_id")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      context.insights = insights || [];

      // Fetch graph nodes for this campaign
      const { data: graphNodes } = await supabase
        .from("graph_nodes")
        .select("id, label, type, description, coverage_status")
        .eq("campaign_id", campaignId)
        .is("deleted_at", null)
        .limit(100);

      context.graphNodes = graphNodes || [];
    }
  }

  // Fetch specific session if needed
  if (sessionId) {
    const { data: session } = await supabase
      .from("sessions")
      .select("id, campaign_id, session_number, status, scheduled_at, ended_at, duration_minutes, notes")
      .eq("id", sessionId)
      .single();

    if (session) {
      context.session = session;

      // Fetch insights for this specific session
      const { data: sessionInsights } = await supabase
        .from("captured_insights")
        .select("id, title, insight, confidence, session_id")
        .eq("session_id", sessionId)
        .is("deleted_at", null);

      if (sessionInsights && sessionInsights.length > 0) {
        context.insights = sessionInsights;
      }
    }
  }

  return context;
}

function buildPrompt(template: ReportTemplate, context: ReportContext, timePeriod?: string): string {
  let prompt = template.prompt_template;

  // Campaign variables
  if (context.campaign) {
    prompt = prompt.replace(/\{\{campaign_name\}\}/g, context.campaign.expert_name);
    prompt = prompt.replace(/\{\{campaign_role\}\}/g, context.campaign.expert_role);
    prompt = prompt.replace(/\{\{expert_name\}\}/g, context.campaign.expert_name);
    prompt = prompt.replace(/\{\{campaign_goal\}\}/g, context.campaign.goal || "Capture tacit knowledge");
    prompt = prompt.replace(/\{\{total_sessions\}\}/g, String(context.campaign.total_sessions || 0));
    prompt = prompt.replace(/\{\{completed_sessions\}\}/g, String(context.campaign.completed_sessions || 0));

    const captureStart = context.campaign.created_at
      ? new Date(context.campaign.created_at).toLocaleDateString()
      : "Unknown";
    const captureEnd = new Date().toLocaleDateString();
    prompt = prompt.replace(/\{\{capture_period\}\}/g, `${captureStart} - ${captureEnd}`);
  }

  // Session variables
  if (context.session) {
    prompt = prompt.replace(/\{\{session_number\}\}/g, String(context.session.session_number));
    prompt = prompt.replace(/\{\{session_date\}\}/g,
      context.session.ended_at
        ? new Date(context.session.ended_at).toLocaleDateString()
        : "Date unknown"
    );
    prompt = prompt.replace(/\{\{duration_minutes\}\}/g, String(context.session.duration_minutes || 0));
  }

  // Topic coverage
  const totalTopics = context.topics.length;
  const capturedTopics = context.topics.filter(t => t.captured).length;
  const fullCoverage = context.topics.filter(t => t.coverage_status === "full").length;
  const partialCoverage = context.topics.filter(t => t.coverage_status === "partial").length;
  const mentionedTopics = context.topics.filter(t => t.coverage_status === "mentioned").length;
  const notDiscussed = context.topics.filter(t => !t.coverage_status || t.coverage_status === "not_discussed").length;
  const coveragePercentage = totalTopics > 0 ? Math.round((fullCoverage / totalTopics) * 100) : 0;

  prompt = prompt.replace(/\{\{total_topics\}\}/g, String(totalTopics));
  prompt = prompt.replace(/\{\{topics_covered\}\}/g, String(capturedTopics));
  prompt = prompt.replace(/\{\{coverage_percentage\}\}/g, String(coveragePercentage));

  // Topic coverage detailed
  const topicCoverageText = context.topics
    .map(t => `- ${t.name}: ${t.coverage_status || "not_discussed"}`)
    .join("\n");
  prompt = prompt.replace(/\{\{topic_coverage\}\}/g, topicCoverageText || "No topics defined yet.");
  prompt = prompt.replace(/\{\{topic_coverage_detailed\}\}/g, topicCoverageText || "No topics defined yet.");

  // Not discussed and partial topics
  const notDiscussedText = context.topics
    .filter(t => !t.coverage_status || t.coverage_status === "not_discussed")
    .map(t => `- ${t.name}`)
    .join("\n");
  prompt = prompt.replace(/\{\{not_discussed_topics\}\}/g, notDiscussedText || "None - all topics have been at least mentioned.");

  const partialText = context.topics
    .filter(t => t.coverage_status === "partial" || t.coverage_status === "mentioned")
    .map(t => `- ${t.name} (${t.coverage_status})`)
    .join("\n");
  prompt = prompt.replace(/\{\{partial_topics\}\}/g, partialText || "None - all discussed topics have full coverage.");

  // Session history
  const sessionHistoryText = context.sessions
    .map(s => {
      const date = s.ended_at ? new Date(s.ended_at).toLocaleDateString() : "Not completed";
      const duration = s.duration_minutes ? `${s.duration_minutes} min` : "N/A";
      return `- Session ${s.session_number}: ${s.status} (${date}, ${duration})`;
    })
    .join("\n");
  prompt = prompt.replace(/\{\{session_history\}\}/g, sessionHistoryText || "No sessions yet.");

  // Insights
  const insightsText = context.insights
    .map(i => `### ${i.title}\n${i.insight}`)
    .join("\n\n");
  prompt = prompt.replace(/\{\{insights\}\}/g, insightsText || "No insights captured yet.");
  prompt = prompt.replace(/\{\{all_insights\}\}/g, insightsText || "No insights captured yet.");
  prompt = prompt.replace(/\{\{insights_summary\}\}/g,
    context.insights.length > 0
      ? `${context.insights.length} insights captured across sessions.`
      : "No insights captured yet."
  );

  // Topics discussed (for session reports)
  const topicsDiscussed = context.topics
    .filter(t => t.captured)
    .map(t => `- ${t.name}`)
    .join("\n");
  prompt = prompt.replace(/\{\{topics_discussed\}\}/g, topicsDiscussed || "No topics marked as covered.");

  // Graph summary
  const graphSummaryText = context.graphNodes.length > 0
    ? `Knowledge graph contains ${context.graphNodes.length} nodes:\n` +
    Object.entries(
      context.graphNodes.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => `- ${type}: ${count}`).join("\n")
    : "Knowledge graph not yet populated.";
  prompt = prompt.replace(/\{\{graph_summary\}\}/g, graphSummaryText);

  // Topic details for expert brief
  const topicDetailsText = context.topics
    .filter(t => t.captured)
    .map(t => {
      const relatedInsights = context.insights
        .filter(i => i.title.toLowerCase().includes(t.name.toLowerCase()))
        .slice(0, 2);
      return `### ${t.name}\n` +
        (relatedInsights.length > 0
          ? relatedInsights.map(i => i.insight).join("\n\n")
          : "No detailed insights captured for this topic.");
    })
    .join("\n\n");
  prompt = prompt.replace(/\{\{topic_details\}\}/g, topicDetailsText || "No detailed topic information available.");

  // Time period
  prompt = prompt.replace(/\{\{time_period\}\}/g, timePeriod || "All time");

  // Transcript summary (for session reports - placeholder)
  prompt = prompt.replace(/\{\{transcript_summary\}\}/g, "Session transcript summary will be included when available.");
  prompt = prompt.replace(/\{\{questions_answered\}\}/g, "Question tracking data will be included when available.");

  return prompt;
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  let html = markdown
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    // Line breaks
    .replace(/\n/g, "<br>");

  // Wrap in paragraph tags
  html = `<p>${html}</p>`;

  // Clean up list items into proper lists
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  return html;
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
