import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Seed jobs from seed_jobs.json
const seedJobs = [
  {
    title: "Software Engineering Intern",
    company: "Google",
    location: "Mountain View, CA",
    description: "Join Google's engineering team for a 12-week summer internship. Work on large-scale distributed systems, contribute to products used by billions. Requirements: Currently pursuing BS/MS in CS, strong coding skills in Python/Java/C++, understanding of data structures and algorithms.",
    source: "linkedin",
    url: "https://careers.google.com/jobs/intern-swe-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "SWE Intern - Summer 2026",
    company: "Meta",
    location: "Menlo Park, CA",
    description: "Build products that connect billions of people. You'll work alongside experienced engineers on real projects. Looking for students with experience in mobile development, systems programming, or machine learning. Must be enrolled in a BS/MS/PhD program.",
    source: "linkedin",
    url: "https://metacareers.com/jobs/swe-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Software Development Engineer Intern",
    company: "Amazon",
    location: "Seattle, WA",
    description: "Design and build innovative technologies in a team environment. Work on real-world problems at massive scale. Requirements: Pursuing a degree in Computer Science or related field, proficiency in at least one programming language, strong problem-solving skills.",
    source: "indeed",
    url: "https://amazon.jobs/sde-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Software Engineering Intern",
    company: "Apple",
    location: "Cupertino, CA",
    description: "Create the next generation of Apple products. Join teams working on iOS, macOS, or hardware/software integration. Looking for passion for technology, strong programming fundamentals, and creative problem-solving abilities.",
    source: "glassdoor",
    url: "https://jobs.apple.com/swe-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Software Engineer Intern",
    company: "Microsoft",
    location: "Redmond, WA",
    description: "Work on products that empower every person and organization. Teams include Azure, Office, Windows, and Xbox. Requirements: Enrolled in BS/MS program, coding experience in C#, C++, Java, or Python, passion for technology.",
    source: "linkedin",
    url: "https://careers.microsoft.com/swe-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Backend Engineering Intern",
    company: "Stripe",
    location: "San Francisco, CA",
    description: "Build the economic infrastructure for the internet. Work on APIs that power millions of businesses. Looking for strong fundamentals in distributed systems, databases, and API design. Ruby, Go, or Java experience preferred.",
    source: "linkedin",
    url: "https://stripe.com/jobs/backend-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Software Engineering Intern",
    company: "Airbnb",
    location: "San Francisco, CA",
    description: "Help create a world where anyone can belong anywhere. Work on the platform powering millions of stays. Requirements: Strong CS fundamentals, experience with web technologies (React, Node.js), passion for travel and community.",
    source: "indeed",
    url: "https://careers.airbnb.com/swe-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Full Stack Engineering Intern",
    company: "Figma",
    location: "San Francisco, CA",
    description: "Build the future of design tools. Work on our web-based collaborative design platform using TypeScript, React, and WebGL. Looking for students passionate about design, performance optimization, and real-time collaboration.",
    source: "linkedin",
    url: "https://figma.com/careers/fullstack-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Software Engineering Intern",
    company: "Notion",
    location: "San Francisco, CA",
    description: "Help build the all-in-one workspace. Work on features used by millions of teams worldwide. Requirements: Strong programming skills, experience with React or similar frameworks, interest in productivity tools.",
    source: "glassdoor",
    url: "https://notion.so/careers/swe-intern-2026",
    date_posted: "2026-02-01"
  },
  {
    title: "Platform Engineering Intern",
    company: "Databricks",
    location: "San Francisco, CA",
    description: "Work on the unified analytics platform. Build infrastructure that processes petabytes of data. Requirements: Experience with Scala, Python, or Java, understanding of distributed systems, interest in big data and ML.",
    source: "linkedin",
    url: "https://databricks.com/careers/platform-intern-2026",
    date_posted: "2026-02-01"
  }
];

interface PipelineStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  count?: number;
}

const extractJsonPayload = (raw: string) => {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1).trim();
  }

  return null;
};

const parseJsonWithRetry = (raw: string) => {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Retry once after extracting a likely JSON block.
    const extracted = extractJsonPayload(trimmed);
    if (!extracted || extracted === trimmed) return null;
    try {
      return JSON.parse(extracted);
    } catch {
      return null;
    }
  }
};

const coerceNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeAnswers = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>);
  const normalized: Record<string, string> = {};
  for (const [question, answer] of entries) {
    normalized[question] = answer === null || answer === undefined ? "" : String(answer);
  }
  return normalized;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const keywordsApiKey = Deno.env.get("KEYWORDSAI_API_KEY");

    if (!keywordsApiKey) {
      throw new Error("KEYWORDSAI_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Running daily pipeline for user: ${user.id}`);

    const openai = new OpenAI({
      baseURL: "https://api.keywordsai.co/api/",
      apiKey: keywordsApiKey,
    });

    const startTime = Date.now();
    const steps: PipelineStep[] = [
      { id: "collect", name: "Collecting jobs", status: "pending" },
      { id: "score", name: "Scoring fit", status: "pending" },
      { id: "draft", name: "Drafting applications", status: "pending" },
    ];

    // Check if user has resume and preferences
    const { data: resume } = await supabase
      .from("resumes")
      .select("resume_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!resume?.resume_text) {
      return new Response(
        JSON.stringify({ 
          error: "Onboarding incomplete: Please add your resume first.",
          code: "MISSING_RESUME"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: preferences } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!preferences || !preferences.roles?.length) {
      return new Response(
        JSON.stringify({ 
          error: "Onboarding incomplete: Please set your job preferences first.",
          code: "MISSING_PREFERENCES"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Step 1: Collect jobs (insert from seed if needed)
    steps[0].status = "running";
    console.log("Step 1: Collecting jobs from seed_jobs.json...");

    // Check existing jobs to avoid duplicates
    const { data: existingJobs } = await supabase
      .from("job_posts")
      .select("url");
    
    const existingUrls = new Set(existingJobs?.map(j => j.url) || []);
    const newJobs = seedJobs.filter(j => !existingUrls.has(j.url));

    let insertedJobs: any[] = [];
    if (newJobs.length > 0) {
      const { data, error: insertError } = await supabase
        .from("job_posts")
        .insert(newJobs)
        .select();

      if (insertError) {
        console.error("Error inserting jobs:", insertError);
        steps[0].status = "failed";
        steps[0].message = insertError.message;
        throw new Error("Failed to collect jobs");
      }
      insertedJobs = data || [];
    }

    // Get all available jobs (including newly inserted)
    const { data: allJobs } = await supabase
      .from("job_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Filter out already matched jobs
    const { data: existingMatches } = await supabase
      .from("job_matches")
      .select("job_post_id")
      .eq("user_id", user.id);

    const matchedJobIds = new Set(existingMatches?.map(m => m.job_post_id) || []);
    const unmatchedJobs = allJobs?.filter(j => !matchedJobIds.has(j.id)) || [];

    steps[0].status = "completed";
    steps[0].count = unmatchedJobs.length;
    steps[0].message = `Found ${unmatchedJobs.length} new jobs to process`;
    console.log(`Step 1 complete: ${unmatchedJobs.length} jobs to process`);

    if (unmatchedJobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          steps,
          summary: {
            jobsCollected: 0,
            matchesScored: 0,
            draftsCreated: 0,
            duration: Date.now() - startTime,
          },
          message: "No new jobs to process. All jobs have been matched."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Score fit for each job
    steps[1].status = "running";
    console.log("Step 2: Scoring job fit...");

    const scoredMatches: any[] = [];
    const allMatches: any[] = [];
    const fitThreshold = 70; // Only draft for jobs with score >= 70
    const fallbackFitScore = 75;

    for (const job of unmatchedJobs) {
      let fitScore = fallbackFitScore;
      let reasons: any = {};

      try {
        console.log(`Scoring: ${job.title} at ${job.company}`);
        
        const fitResponse = await openai.chat.completions.create({
          model: "fit_scorer_v1",
          messages: [
            {
              role: "user",
              content: JSON.stringify({
                resume: resume.resume_text,
                job: {
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  description: job.description,
                },
                preferences: {
                  roles: preferences.roles,
                  locations: preferences.locations,
                  remote_ok: preferences.remote_ok,
                  sponsorship_needed: preferences.sponsorship_needed,
                  min_salary: preferences.min_salary,
                },
                profile: profile ? {
                  graduation_date: profile.graduation_date,
                  work_authorization: profile.work_authorization,
                } : null,
              }),
            },
          ],
        });

        const fitContent = fitResponse.choices[0]?.message?.content || "{}";
        console.log(`Fit response for ${job.title}:`, fitContent.substring(0, 200));

        const parsed = parseJsonWithRetry(fitContent);
        if (parsed && typeof parsed === "object") {
          const parsedRecord = parsed as Record<string, unknown>;
          fitScore = coerceNumber(parsedRecord.score ?? parsedRecord.fit_score, fallbackFitScore);
          reasons = parsedRecord.reasons ?? parsedRecord;
        }
      } catch (jobError) {
        console.error(`Error scoring ${job.title}:`, jobError);
        reasons = { error: "FIT_SCORER_FAILED" };
      }

      // Normalize score
      fitScore = Math.min(100, Math.max(0, Math.round(fitScore)));
      console.log(`Score for ${job.title}: ${fitScore}`);

      // Create match record
      const { data: match, error: matchError } = await supabase
        .from("job_matches")
        .insert({
          job_post_id: job.id,
          user_id: user.id,
          fit_score: fitScore,
          status: fitScore >= fitThreshold ? "DRAFTED" : "SKIPPED",
          reasons,
        })
        .select()
        .single();

      if (matchError) {
        console.error(`Error creating match for ${job.title}:`, matchError);
        continue;
      }

      const matchBundle = { match, job, fitScore };
      allMatches.push(matchBundle);

      if (fitScore >= fitThreshold) {
        scoredMatches.push(matchBundle);
      }
    }

    if (scoredMatches.length === 0 && allMatches.length > 0) {
      const fallbackCount = Math.min(3, allMatches.length);
      const fallbackMatches = [...allMatches]
        .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
        .slice(0, fallbackCount);

      const fallbackIds = fallbackMatches.map((m) => m.match.id);
      await supabase
        .from("job_matches")
        .update({ status: "DRAFTED" })
        .in("id", fallbackIds);

      scoredMatches.push(...fallbackMatches);
      steps[1].message = `No jobs met the ${fitThreshold}% threshold. Drafting top ${fallbackCount} for demo.`;
    } else {
      steps[1].message = `${scoredMatches.length} jobs scored above ${fitThreshold}%`;
    }

    steps[1].status = "completed";
    steps[1].count = scoredMatches.length;
    console.log(`Step 2 complete: ${scoredMatches.length} high-scoring matches`);

    // Step 3: Generate drafts for high-scoring matches
    steps[2].status = "running";
    console.log("Step 3: Generating application drafts...");

    let draftsCreated = 0;

    for (const { match, job } of scoredMatches) {
      console.log(`Generating draft for: ${job.title}`);

      let coverLetter = "";
      let answersJson: Record<string, string> = {};
      let confidence = 0.9;
      let issues: string[] = [];
      let draftContent = "";

      try {
        const draftResponse = await openai.chat.completions.create({
          model: "application_generator_v1",
          messages: [
            {
              role: "user",
              content: JSON.stringify({
                resume: resume.resume_text,
                job: {
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  description: job.description,
                },
                profile: profile ? {
                  full_name: profile.full_name,
                  graduation_date: profile.graduation_date,
                  work_authorization: profile.work_authorization,
                  gender: profile.gender,
                  race: profile.race,
                  other_info: profile.other_info,
                } : null,
              }),
            },
          ],
        });

        draftContent = draftResponse.choices[0]?.message?.content || "";
        console.log(`Draft response for ${job.title}:`, draftContent.substring(0, 200));

        const parsed = parseJsonWithRetry(draftContent);
        if (parsed && typeof parsed === "object") {
          const parsedRecord = parsed as Record<string, unknown>;
          coverLetter = String(parsedRecord.cover_letter ?? parsedRecord.coverLetter ?? "");
          answersJson = normalizeAnswers(
            parsedRecord.answers ?? parsedRecord.answers_json ?? parsedRecord.answersJson
          );
          let confidenceValue = coerceNumber(parsedRecord.confidence, 0.9);
          if (confidenceValue > 1) confidenceValue = confidenceValue / 100;
          confidence = Math.min(1, Math.max(0, confidenceValue));
          issues = Array.isArray(parsedRecord.issues)
            ? parsedRecord.issues.map((issue) => String(issue))
            : [];
        } else if (draftContent.trim()) {
          coverLetter = draftContent;
        }
      } catch (draftError) {
        console.error(`Error generating draft for ${job.title}:`, draftError);
        issues.push("LLM generation failed; using fallback draft.");
      }

      if (!coverLetter) {
        coverLetter = `Dear Hiring Manager,

I am excited to apply for the ${job.title || "role"} at ${job.company || "your company"}. Based on my background and coursework, I believe I can contribute quickly and grow in this position.

Thank you for your time and consideration. I look forward to the opportunity to discuss how I can help your team.

Best regards`;
        confidence = Math.min(confidence, 0.6);
        issues.push("Draft content missing; fallback template used.");
      }

      // Check for "NEEDS USER INPUT" markers
      if (
        coverLetter.includes("NEEDS USER INPUT") ||
        Object.values(answersJson).some((v) => String(v).includes("NEEDS USER INPUT"))
      ) {
        issues.push("Some fields need user review");
        confidence = Math.min(confidence, 0.5);
      }

      // Determine status based on confidence
      const matchStatus = confidence < 0.7 ? "NEEDS_REVIEW" : "DRAFTED";

      // Update match status if needed
      if (matchStatus !== "DRAFTED") {
        await supabase
          .from("job_matches")
          .update({ status: matchStatus })
          .eq("id", match.id);
      }

      // Create draft
      const { error: draftError } = await supabase
        .from("application_drafts")
        .insert({
          job_match_id: match.id,
          cover_letter: coverLetter,
          answers_json: answersJson,
          tailoring_notes: { 
            generated_at: new Date().toISOString(),
            confidence,
            issues,
            prompt_name: "application_generator_v1",
            model: "keywords_ai",
          },
          version_meta: {
            version: 1,
            prompt_name: "application_generator_v1",
          },
        });

      if (draftError) {
        console.error(`Error creating draft for ${job.title}:`, draftError);
        continue;
      }

      draftsCreated++;
      console.log(`Draft created for: ${job.title}`);
    }

    steps[2].status = "completed";
    steps[2].count = draftsCreated;
    steps[2].message = `Generated ${draftsCreated} application drafts`;
    console.log(`Step 3 complete: ${draftsCreated} drafts created`);

    const duration = Date.now() - startTime;

    console.log("Daily pipeline complete:", {
      jobsCollected: unmatchedJobs.length,
      matchesScored: scoredMatches.length,
      draftsCreated,
      duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        steps,
        summary: {
          jobsCollected: unmatchedJobs.length,
          matchesScored: scoredMatches.length,
          draftsCreated,
          duration,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Run daily error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
