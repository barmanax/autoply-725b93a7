-- Enable RLS on profiles and submission_events tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can only access their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Submission events policies - users can access events for their own job matches
CREATE POLICY "Users can view their own submission events"
ON public.submission_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_matches
    WHERE job_matches.id = submission_events.job_match_id
    AND job_matches.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own submission events"
ON public.submission_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.job_matches
    WHERE job_matches.id = submission_events.job_match_id
    AND job_matches.user_id = auth.uid()
  )
);