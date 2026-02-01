import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox as InboxIcon, Settings, Building2, MapPin, ExternalLink, Trash2, Loader2 } from "lucide-react";

type JobMatch = {
  id: string;
  fit_score: number | null;
  status: string | null;
  created_at: string | null;
  job_posts: {
    id: string;
    title: string | null;
    company: string | null;
    location: string | null;
  } | null;
};

export default function Inbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches, isLoading, error } = useQuery({
    queryKey: ["job-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_matches")
        .select(`
          id,
          fit_score,
          status,
          created_at,
          job_posts (
            id,
            title,
            company,
            location
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as JobMatch[];
    },
  });

  const clearInbox = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get all job matches for this user
      const { data: userMatches, error: matchError } = await supabase
        .from("job_matches")
        .select("id")
        .eq("user_id", user.id);

      if (matchError) throw matchError;

      const matchIds = userMatches?.map(m => m.id) || [];

      if (matchIds.length > 0) {
        // Delete application drafts first (foreign key constraint)
        const { error: draftsError } = await supabase
          .from("application_drafts")
          .delete()
          .in("job_match_id", matchIds);

        if (draftsError) throw draftsError;

        // Delete submission events
        const { error: eventsError } = await supabase
          .from("submission_events")
          .delete()
          .in("job_match_id", matchIds);

        if (eventsError) throw eventsError;

        // Delete job matches
        const { error: matchesDeleteError } = await supabase
          .from("job_matches")
          .delete()
          .eq("user_id", user.id);

        if (matchesDeleteError) throw matchesDeleteError;
      }

      return matchIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["job-matches"] });
      toast({
        title: "Inbox cleared",
        description: `Removed ${count} job matches and their drafts.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to clear inbox",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const getStatusVariant = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case "APPLIED":
        return "default";
      case "DRAFTED":
        return "secondary";
      case "REJECTED":
        return "destructive";
      case "INTERVIEWING":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getFitScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            Your matched jobs and application status
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => clearInbox.mutate()}
            disabled={clearInbox.isPending || !matches?.length}
          >
            {clearInbox.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear Inbox
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/run">
              <Settings className="h-4 w-4 mr-2" />
              Admin Run
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load job matches. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && matches?.length === 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <InboxIcon className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>No matches yet</CardTitle>
                <CardDescription>
                  Run the job matcher to find opportunities that fit your profile
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && matches && matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((match) => (
            <Link key={match.id} to={`/draft/${match.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {match.job_posts?.title || "Untitled Position"}
                        </h3>
                        <Badge variant={getStatusVariant(match.status)}>
                          {match.status || "DRAFTED"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {match.job_posts?.company || "Unknown Company"}
                        </span>
                        {match.job_posts?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.job_posts.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Fit Score</p>
                        <p className={`text-lg font-bold ${getFitScoreColor(match.fit_score)}`}>
                          {match.fit_score ?? "—"}%
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
