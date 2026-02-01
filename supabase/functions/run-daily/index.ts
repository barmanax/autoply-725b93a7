import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hardcoded demo data - fit scores and cover letters based on Aditya Barman's resume
const DEMO_MATCHES: Record<string, { fitScore: number; reasons: string[]; coverLetter: string }> = {
  "Google": {
    fitScore: 94,
    reasons: [
      "Strong Python/Java experience from Motorola and DoD internships",
      "Distributed systems experience with RAG pipeline handling 30k+ documents",
      "4.0 GPA at UIUC demonstrates academic excellence"
    ],
    coverLetter: `Dear Google Hiring Team,

I am excited to apply for the Software Engineering Intern position at Google. As a Computer Science student at the University of Illinois at Urbana-Champaign with a 4.0 GPA and extensive hands-on experience, I am eager to contribute to large-scale distributed systems at Google.

During my internship at Motorola Solutions, I designed and deployed a full-stack RAG system using LangChain and ChromaDB that indexed 30,000+ proprietary documents, directly supporting 350 systems engineers. This experience gave me deep insight into building scalable systems that serve real users—exactly the kind of impact I hope to make at Google.

My work at the Department of Defense's AI4Defense program further developed my ability to build production-quality software, where I developed a Python application with OpenAI API integration that automated workflows and reduced manual effort by 90%.

I am particularly drawn to Google's commitment to building products used by billions. I would welcome the opportunity to discuss how my experience with distributed systems, machine learning pipelines, and full-stack development can contribute to your engineering team.

Thank you for considering my application.

Best regards,
Aditya Barman`
  },
  "Amazon": {
    fitScore: 91,
    reasons: [
      "Full-stack development experience across multiple internships",
      "Experience with Python and cloud technologies (AWS, GCP)",
      "Strong problem-solving skills demonstrated in hackathon wins"
    ],
    coverLetter: `Dear Amazon Hiring Team,

I am writing to express my strong interest in the Software Development Engineer Intern position at Amazon. As a Computer Science student at UIUC with multiple internship experiences building scalable systems, I am excited about the opportunity to tackle real-world problems at Amazon's massive scale.

At Motorola Solutions, I built and deployed production systems used organization-wide, including a documentation generation pipeline and a RAG system serving 350 engineers. This hands-on experience with production deployments has prepared me for Amazon's fast-paced, customer-focused environment.

My project EchoBrief, selected as a Top 10 project out of 495 submissions in Motorola's Open Innovation Hackathon, demonstrates my ability to rapidly prototype and deliver impactful solutions. The project integrated OpenAI Whisper and Google Gemini API to reduce after-action review time by 70%.

I am proficient in Python, Java, TypeScript, and have hands-on experience with AWS and GCP. I would love the opportunity to apply my skills to Amazon's innovative technologies.

Thank you for your consideration.

Best regards,
Aditya Barman`
  },
  "Meta": {
    fitScore: 89,
    reasons: [
      "React and full-stack experience from LearnLion project",
      "Mobile development exposure through cross-platform work",
      "Machine learning background relevant to Meta's AI initiatives"
    ],
    coverLetter: `Dear Meta Recruiting Team,

I am thrilled to apply for the SWE Intern position at Meta. The opportunity to build products that connect billions of people aligns perfectly with my passion for creating impactful technology.

My experience building LearnLion, an interactive learning platform using React and Flask with Gemini API integration, demonstrates my full-stack capabilities and my interest in building engaging user experiences. I have also worked extensively with machine learning systems, including developing a RAG system at Motorola that serves 350 engineers daily.

At the Department of Defense, I built a full-stack prototype supporting PDF ingestion, analysis, and visualization—showcasing my ability to handle complex data flows and create intuitive interfaces. My work was recognized with a podium finish at the AI4Defense Showcase.

I am excited about Meta's work in AI and its mission to build meaningful connections. I would be honored to contribute to products used by billions.

Sincerely,
Aditya Barman`
  },
  "Apple": {
    fitScore: 88,
    reasons: [
      "Strong programming fundamentals with 4.0 GPA",
      "Experience with ML models that run efficiently (edge deployment focus at Motorola)",
      "Creative problem-solving demonstrated across multiple projects"
    ],
    coverLetter: `Dear Apple Hiring Team,

I am excited to apply for the Software Engineering Intern position at Apple. Apple's dedication to creating seamless user experiences through innovative technology resonates deeply with my approach to software development.

My work at Motorola Solutions involved deploying ML models and building systems with a focus on efficiency—including extending a RAG system with multimodal capabilities using OpenAI CLIP embeddings. This experience in optimizing models for practical deployment aligns with Apple's emphasis on on-device performance.

As a researcher at UIUC in collaboration with the USDA, I engineered computer vision pipelines using OpenCV and TensorFlow, achieving 95%+ success rates in image analysis. This work required creative problem-solving and attention to detail—values I see reflected in Apple's products.

I am passionate about building technology that delights users, and I would be honored to contribute to the next generation of Apple products.

Best regards,
Aditya Barman`
  },
  "Microsoft": {
    fitScore: 90,
    reasons: [
      "Strong coding experience in Python, C++, and Java",
      "Cloud experience with Azure-compatible technologies",
      "Passion for technology demonstrated through research and hackathons"
    ],
    coverLetter: `Dear Microsoft Hiring Team,

I am writing to apply for the Software Engineer Intern position at Microsoft. Microsoft's mission to empower every person and organization aligns with my passion for building accessible, impactful technology.

During my internship at Motorola Solutions, I designed systems that empowered hundreds of engineers to access knowledge more efficiently. My RAG system improved retrieval precision by 40% and boosted accuracy by 65%, directly impacting productivity across the organization.

My research at George Mason University comparing LLM performance in educational settings demonstrates my interest in AI technologies that enhance human capabilities—similar to Microsoft's work on Copilot and intelligent features.

I have strong experience with Python, C++, and Java, along with cloud technologies including GCP and Docker. I am excited about the opportunity to work on products like Azure, Office, or Windows that touch millions of users.

Thank you for considering my application.

Best regards,
Aditya Barman`
  },
  "Netflix": {
    fitScore: 85,
    reasons: [
      "Strong Python and JavaScript experience",
      "ML background relevant to personalization systems",
      "Experience with data processing at scale"
    ],
    coverLetter: `Dear Netflix Hiring Team,

I am excited to apply for the Software Engineering Intern position at Netflix. The opportunity to work on the streaming platform that entertains 250M+ members worldwide is incredibly appealing.

My experience building data-intensive systems at Motorola—processing 30,000+ documents with vector embeddings—has prepared me for working with Netflix's scale of data. I have strong fundamentals in Python, Java, and JavaScript, and I am passionate about building systems that deliver exceptional user experiences.

My machine learning background, including work with TensorFlow regression models and RAG systems, is relevant to Netflix's personalization and recommendation systems. I am eager to apply these skills to improve how millions of users discover content.

I would be honored to contribute to Netflix's engineering team.

Best regards,
Aditya Barman`
  },
  "Stripe": {
    fitScore: 92,
    reasons: [
      "Backend engineering experience with API development",
      "Experience with distributed systems and databases",
      "Strong fundamentals demonstrated through DoD internship"
    ],
    coverLetter: `Dear Stripe Hiring Team,

I am thrilled to apply for the Backend Engineering Intern position at Stripe. Building the economic infrastructure for the internet is exactly the kind of high-impact work I am passionate about.

At Motorola Solutions, I designed and deployed backend systems including ingestion pipelines with chunking, embeddings, and access controls. My experience building APIs that serve real users—supporting 350 systems engineers—has prepared me for Stripe's focus on reliable, scalable infrastructure.

My work at the Department of Defense involved building full-stack prototypes with careful attention to data integrity and security—values I know are paramount at Stripe. I have experience with Python, Go, and PostgreSQL, along with a strong foundation in distributed systems.

I am excited about the opportunity to contribute to APIs that power millions of businesses worldwide.

Best regards,
Aditya Barman`
  },
  "Nvidia": {
    fitScore: 93,
    reasons: [
      "Strong ML/AI experience with PyTorch and TensorFlow",
      "C++ experience for GPU computing",
      "Deep learning research background from UIUC"
    ],
    coverLetter: `Dear Nvidia Hiring Team,

I am excited to apply for the Software Engineering Intern position at Nvidia. The opportunity to work on GPU computing and AI infrastructure powering the AI revolution is deeply aligned with my experience and interests.

My work at Motorola Solutions involved building multimodal ML systems using OpenAI CLIP embeddings and deploying production pipelines—exactly the kind of applied AI work that Nvidia enables. I have strong experience with PyTorch and TensorFlow from my research at UIUC, where I applied deep learning to agricultural analysis.

I have C++ experience and am eager to develop CUDA skills. My background in building efficient ML pipelines, combined with my passion for pushing the boundaries of what's possible with AI, makes me an excellent fit for Nvidia's mission.

I would be honored to contribute to the technology powering the AI revolution.

Best regards,
Aditya Barman`
  },
  "OpenAI": {
    fitScore: 95,
    reasons: [
      "Extensive experience with LLMs and AI APIs (OpenAI, Gemini)",
      "Published research on LLM evaluation at MIT URTC",
      "Production ML systems with RAG and embeddings"
    ],
    coverLetter: `Dear OpenAI Hiring Team,

I am incredibly excited to apply for the Machine Learning Engineering Intern position at OpenAI. Building safe and beneficial AI systems is the defining challenge of our generation, and I am eager to contribute.

My research at George Mason University directly evaluated LLM performance, comparing ChatGPT, Copilot, Claude, and Gemini for algorithm assignment grading. This work, co-authored in a paper accepted to MIT's URTC 2024, gave me deep insight into LLM capabilities and limitations.

At Motorola Solutions, I built production RAG systems using LangChain, ChromaDB, and HuggingFace embeddings, serving 350 engineers. I also extended these systems with multimodal capabilities using OpenAI CLIP—demonstrating my ability to work with cutting-edge AI in production settings.

My strong ML fundamentals, experience with PyTorch and TensorFlow, and passion for AI safety make me an ideal candidate. I would be honored to contribute to OpenAI's mission.

Best regards,
Aditya Barman`
  },
  "Databricks": {
    fitScore: 87,
    reasons: [
      "Experience with big data processing and ML pipelines",
      "Python and distributed systems experience",
      "Interest in data infrastructure demonstrated through projects"
    ],
    coverLetter: `Dear Databricks Hiring Team,

I am excited to apply for the Software Engineering Intern position at Databricks. Building the unified analytics platform that processes petabytes of data is exactly the kind of impactful infrastructure work I am passionate about.

At Motorola Solutions, I built data pipelines that processed 30,000+ documents with vector embeddings and implemented ingestion pipelines with chunking and access controls. This experience with data infrastructure at scale has prepared me for Databricks' focus on big data and ML.

I have strong experience with Python and have worked with distributed processing patterns. My background in machine learning, including TensorFlow regression models and RAG systems, aligns well with Databricks' mission to democratize data and AI.

I would be honored to contribute to infrastructure that powers data-driven decisions worldwide.

Best regards,
Aditya Barman`
  },
  "Airbnb": {
    fitScore: 84,
    reasons: [
      "Full-stack development experience with React and Python",
      "Statistical modeling experience from USDA research",
      "Strong SQL and data analysis skills"
    ],
    coverLetter: `Dear Airbnb Hiring Team,

I am excited to apply for the Data Science Intern position at Airbnb. The opportunity to use data to improve the travel experience for millions of guests and hosts is incredibly appealing.

My research at UIUC in collaboration with the USDA involved statistical modeling and machine learning to predict agricultural outcomes, producing datasets of 1,700+ measurements. This experience with regression models, feature extraction, and data analysis has prepared me for Airbnb's data-driven approach.

I have strong skills in Python and SQL, and my work at the Department of Defense involved building visualization tools for rapid assessment—demonstrating my ability to communicate insights effectively.

I would be honored to contribute to Airbnb's mission of creating a world where anyone can belong anywhere.

Best regards,
Aditya Barman`
  },
  "Ramp": {
    fitScore: 96,
    reasons: [
      "Strong TypeScript and Python experience",
      "Full-stack development across multiple production systems",
      "Fintech interest demonstrated through impactful projects"
    ],
    coverLetter: `Dear Ramp Hiring Team,

I am thrilled to apply for the Software Engineer Intern position at Ramp. Building the future of corporate finance at a fast-growing startup is exactly the kind of high-impact opportunity I am seeking.

My internship at Motorola Solutions demonstrated my ability to ship real features to production—deploying systems used organization-wide by 350 engineers. I have strong TypeScript and Python skills, and I thrive in fast-paced environments that value shipping quickly and iterating.

My project EchoBrief, selected as a Top 10 project out of 495 submissions in Motorola's hackathon, shows my ability to rapidly build and deliver impactful solutions. At the Department of Defense, I automated workflows that reduced manual effort by 90%—the kind of efficiency gains that I know Ramp values.

I am passionate about fintech and excited about Ramp's mission. I would love to contribute to your world-class engineering team.

Best regards,
Aditya Barman`
  }
};

// Fallback for companies not in the hardcoded list
const DEFAULT_MATCH = {
  fitScore: 82,
  reasons: [
    "Strong CS fundamentals with 4.0 GPA at UIUC",
    "Multiple internship experiences across tech companies",
    "Full-stack development skills with Python and TypeScript"
  ],
  coverLetter: `Dear Hiring Team,

I am excited to apply for this internship position. As a Computer Science student at the University of Illinois at Urbana-Champaign with a 4.0 GPA and multiple internship experiences, I am eager to contribute to your team.

My experience at Motorola Solutions, the Department of Defense, and UIUC has prepared me with strong full-stack development skills, machine learning experience, and the ability to deliver production-quality software.

I would be honored to bring my skills and passion to your organization.

Best regards,
Aditya Barman`
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    console.log(`Running demo pipeline for user: ${user.id}`);

    const startTime = Date.now();

    // Get unmatched job posts
    const { data: existingMatches } = await supabase
      .from("job_matches")
      .select("job_post_id")
      .eq("user_id", user.id);

    const matchedJobIds = existingMatches?.map(m => m.job_post_id) || [];

    const { data: jobPosts, error: jobsError } = await supabase
      .from("job_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw new Error("Failed to fetch job posts");
    }

    const unmatchedJobs = jobPosts?.filter(j => !matchedJobIds.includes(j.id)) || [];
    console.log(`Found ${unmatchedJobs.length} unmatched jobs to process`);

    const results = {
      jobsProcessed: 0,
      matchesCreated: 0,
      draftsCreated: 0,
      errors: [] as string[],
    };

    for (const job of unmatchedJobs) {
      try {
        results.jobsProcessed++;

        // Get hardcoded data for this company, or use default
        const matchData = DEMO_MATCHES[job.company || ""] || DEFAULT_MATCH;

        console.log(`Creating match for: ${job.title} at ${job.company} (score: ${matchData.fitScore})`);

        // Create the match
        const { data: match, error: matchError } = await supabase
          .from("job_matches")
          .insert({
            job_post_id: job.id,
            user_id: user.id,
            fit_score: matchData.fitScore,
            status: "DRAFTED",
            reasons: matchData.reasons,
          })
          .select()
          .single();

        if (matchError) {
          console.error(`Error creating match for job ${job.id}:`, matchError);
          results.errors.push(`Match error for ${job.title}: ${matchError.message}`);
          continue;
        }

        results.matchesCreated++;

        // Create the draft with hardcoded cover letter
        const { error: draftError } = await supabase
          .from("application_drafts")
          .insert({
            job_match_id: match.id,
            cover_letter: matchData.coverLetter,
            answers_json: {
              "Why are you interested in this role?": `I am excited about the opportunity to work at ${job.company} because of its impact on the industry and alignment with my skills in software engineering and machine learning.`,
              "Describe a challenging project you've worked on.": "At Motorola Solutions, I designed and deployed a full-stack RAG system that indexed 30,000+ documents, improving retrieval precision by 40% and serving 350 engineers daily.",
              "What are your career goals?": "I aim to become a technical leader building products that impact millions of users, combining my interests in AI/ML with practical software engineering."
            },
            tailoring_notes: { 
              generated_at: new Date().toISOString(),
              demo_mode: true,
              profile: "Aditya Barman - UIUC CS '28"
            },
          });

        if (draftError) {
          console.error(`Error creating draft for match ${match.id}:`, draftError);
          results.errors.push(`Draft error for ${job.title}: ${draftError.message}`);
          continue;
        }

        results.draftsCreated++;
        console.log(`Successfully processed job: ${job.title}`);

      } catch (jobError) {
        console.error(`Error processing job ${job.id}:`, jobError);
        results.errors.push(`${job.title}: ${jobError instanceof Error ? jobError.message : "Unknown error"}`);
      }
    }

    const duration = Date.now() - startTime;

    console.log("Demo pipeline complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        duration,
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
