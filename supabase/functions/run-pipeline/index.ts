import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PipelineStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  count?: number;
}

interface PipelineResult {
  steps: PipelineStep[];
  summary: {
    jobsScraped: number;
    matchesFound: number;
    draftsCreated: number;
    duration: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
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

    console.log(`Running pipeline for user: ${user.id}`);
    
    const startTime = Date.now();
    const steps: PipelineStep[] = [
      { id: "scrape", name: "Scraping job boards", status: "pending" },
      { id: "match", name: "Matching jobs to profile", status: "pending" },
      { id: "draft", name: "Generating application drafts", status: "pending" },
    ];

    // Step 1: Scrape jobs (simulated - in real implementation, would scrape actual job boards)
    steps[0].status = "running";
    console.log("Step 1: Scraping jobs...");
    
    // Simulate scraping by creating some sample job posts
    const sampleJobs = [
      {
        title: "Senior Software Engineer",
        company: "TechCorp Inc",
        location: "San Francisco, CA",
        description: "We are looking for a senior software engineer with 5+ years of experience in React and Node.js.",
        source: "linkedin",
        url: "https://example.com/job1",
        date_posted: new Date().toISOString(),
      },
      {
        title: "Full Stack Developer",
        company: "StartupXYZ",
        location: "Remote",
        description: "Join our fast-growing startup as a full stack developer. Experience with TypeScript and PostgreSQL required.",
        source: "indeed",
        url: "https://example.com/job2",
        date_posted: new Date().toISOString(),
      },
      {
        title: "Frontend Engineer",
        company: "DesignHub",
        location: "New York, NY",
        description: "Frontend engineer position focusing on React, CSS, and accessibility. Remote-friendly.",
        source: "glassdoor",
        url: "https://example.com/job3",
        date_posted: new Date().toISOString(),
      },
    ];

    const { data: insertedJobs, error: jobsError } = await supabase
      .from("job_posts")
      .insert(sampleJobs)
      .select();

    if (jobsError) {
      console.error("Error inserting jobs:", jobsError);
      steps[0].status = "failed";
      steps[0].message = jobsError.message;
      return new Response(
        JSON.stringify({ steps, error: "Failed to scrape jobs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    steps[0].status = "completed";
    steps[0].count = insertedJobs?.length || 0;
    steps[0].message = `Found ${insertedJobs?.length || 0} new jobs`;
    console.log(`Step 1 complete: ${insertedJobs?.length} jobs scraped`);

    // Step 2: Match jobs to user profile
    steps[1].status = "running";
    console.log("Step 2: Matching jobs...");

    // Get user preferences
    const { data: preferences } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Create matches for each job with simulated fit scores
    const matches = (insertedJobs || []).map((job) => {
      // Simulate fit scoring based on preferences
      let score = Math.floor(Math.random() * 30) + 60; // Base score 60-90
      
      if (preferences) {
        // Boost score if remote and user wants remote
        if (preferences.remote_ok && job.location?.toLowerCase().includes("remote")) {
          score = Math.min(100, score + 10);
        }
        // Boost score if location matches
        if (preferences.locations?.some((loc: string) => 
          job.location?.toLowerCase().includes(loc.toLowerCase())
        )) {
          score = Math.min(100, score + 5);
        }
      }

      return {
        job_post_id: job.id,
        user_id: user.id,
        fit_score: score,
        status: "DRAFTED",
        reasons: {
          skills_match: Math.floor(Math.random() * 20) + 70,
          location_match: job.location?.toLowerCase().includes("remote") ? 100 : 80,
          experience_match: Math.floor(Math.random() * 20) + 75,
        },
      };
    });

    const { data: insertedMatches, error: matchesError } = await supabase
      .from("job_matches")
      .insert(matches)
      .select();

    if (matchesError) {
      console.error("Error creating matches:", matchesError);
      steps[1].status = "failed";
      steps[1].message = matchesError.message;
      return new Response(
        JSON.stringify({ steps, error: "Failed to match jobs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    steps[1].status = "completed";
    steps[1].count = insertedMatches?.length || 0;
    steps[1].message = `Matched ${insertedMatches?.length || 0} jobs`;
    console.log(`Step 2 complete: ${insertedMatches?.length} matches created`);

    // Step 3: Generate drafts
    steps[2].status = "running";
    console.log("Step 3: Generating drafts...");

    // Get user resume
    const { data: resume } = await supabase
      .from("resumes")
      .select("resume_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const drafts = (insertedMatches || []).map((match, index) => {
      const job = insertedJobs?.[index];
      return {
        job_match_id: match.id,
        cover_letter: `Dear Hiring Manager,

I am excited to apply for the ${job?.title || "position"} at ${job?.company || "your company"}. With my experience and skills, I believe I would be a great fit for this role.

${resume?.resume_text ? "Based on my background, I bring relevant experience that aligns with your requirements." : "I am eager to contribute my skills to your team."}

I look forward to discussing how I can contribute to ${job?.company || "your organization"}.

Best regards`,
        answers_json: {},
        tailoring_notes: {
          key_skills: ["React", "TypeScript", "Node.js"],
          company_values: ["Innovation", "Collaboration"],
        },
      };
    });

    const { data: insertedDrafts, error: draftsError } = await supabase
      .from("application_drafts")
      .insert(drafts)
      .select();

    if (draftsError) {
      console.error("Error creating drafts:", draftsError);
      steps[2].status = "failed";
      steps[2].message = draftsError.message;
      return new Response(
        JSON.stringify({ steps, error: "Failed to generate drafts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    steps[2].status = "completed";
    steps[2].count = insertedDrafts?.length || 0;
    steps[2].message = `Generated ${insertedDrafts?.length || 0} drafts`;
    console.log(`Step 3 complete: ${insertedDrafts?.length} drafts created`);

    const duration = Date.now() - startTime;

    const result: PipelineResult = {
      steps,
      summary: {
        jobsScraped: insertedJobs?.length || 0,
        matchesFound: insertedMatches?.length || 0,
        draftsCreated: insertedDrafts?.length || 0,
        duration,
      },
    };

    console.log("Pipeline completed successfully:", result.summary);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Pipeline error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
