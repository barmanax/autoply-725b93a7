import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  Search,
  Target,
  FileText,
  ArrowRight,
  CalendarClock,
  Mail,
  Zap,
  Sparkles,
  Bell,
  Globe
} from "lucide-react";

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

const stepIcons: Record<string, typeof Search> = {
  scrape: Search,
  match: Target,
  draft: FileText,
};

const WEEKDAYS = [
  { id: "mon", label: "M", full: "Monday" },
  { id: "tue", label: "T", full: "Tuesday" },
  { id: "wed", label: "W", full: "Wednesday" },
  { id: "thu", label: "T", full: "Thursday" },
  { id: "fri", label: "F", full: "Friday" },
  { id: "sat", label: "S", full: "Saturday" },
  { id: "sun", label: "S", full: "Sunday" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)", offset: "UTC-5" },
  { value: "America/Chicago", label: "Central Time (CT)", offset: "UTC-6" },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: "UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "UTC-8" },
  { value: "America/Phoenix", label: "Arizona Time", offset: "UTC-7" },
  { value: "Europe/London", label: "London (GMT)", offset: "UTC+0" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "UTC+1" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "UTC+9" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "UTC+8" },
  { value: "Australia/Sydney", label: "Sydney (AEST)", offset: "UTC+11" },
];

export default function AdminRun() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PipelineResult | null>(null);
  
  // Schedule state (dummy for MVP)
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimezone, setScheduleTimezone] = useState("America/New_York");
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSaveSchedule = () => {
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 3000);
  };

  const runPipeline = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("run-pipeline", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data as PipelineResult;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const getStepStatus = (step: PipelineStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground/50" />;
    }
  };

  const getProgressValue = () => {
    if (!result?.steps) return 0;
    const completed = result.steps.filter(s => s.status === "completed").length;
    return (completed / result.steps.length) * 100;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Pipeline Control</h1>
          </div>
          <p className="text-muted-foreground max-w-lg">
            Automate your job search with intelligent matching and personalized cover letters
          </p>
        </div>
      </div>

      <Tabs defaultValue="run" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-2 p-1 h-12">
          <TabsTrigger value="run" className="gap-2 text-sm data-[state=active]:shadow-md transition-all">
            <Play className="h-4 w-4" />
            Run Now
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2 text-sm data-[state=active]:shadow-md transition-all">
            <CalendarClock className="h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="mt-8 space-y-6 animate-fade-in">
          {/* Run Button Card */}
          <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 ring-4 ring-primary/5">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Run Pipeline</CardTitle>
                    <CardDescription className="text-sm">
                      Scrape → Match → Draft in one click
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setResult(null);
                    runPipeline.mutate();
                  }}
                  disabled={runPipeline.isPending}
                  size="lg"
                  className="h-12 px-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {runPipeline.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start Pipeline
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {(runPipeline.isPending || result) && (
              <CardContent className="pt-6 space-y-6">
                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Pipeline Progress</span>
                    <span className="font-bold text-primary">{Math.round(getProgressValue())}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={getProgressValue()} className="h-3" />
                    <div 
                      className="absolute top-0 left-0 h-3 bg-primary/20 rounded-full animate-pulse"
                      style={{ width: `${getProgressValue()}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {(result?.steps || [
                    { id: "scrape", name: "Scraping job boards", status: "pending" as const },
                    { id: "match", name: "Matching jobs to profile", status: "pending" as const },
                    { id: "draft", name: "Generating application drafts", status: "pending" as const },
                  ]).map((step, index) => {
                    const Icon = stepIcons[step.id] || Search;
                    const isActive = step.status === "running";
                    const isComplete = step.status === "completed";
                    
                    return (
                      <div
                        key={step.id}
                        className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
                          isActive
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                            : isComplete
                            ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : step.status === "failed"
                            ? "border-destructive/50 bg-destructive/5"
                            : "border-border/50 bg-muted/20"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse" />
                        )}
                        <div className="relative flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl transition-all ${
                            isComplete 
                              ? "bg-emerald-100 dark:bg-emerald-900/50" 
                              : isActive
                              ? "bg-primary/15 ring-2 ring-primary/20"
                              : "bg-muted/50"
                          }`}>
                            <Icon className={`h-5 w-5 transition-colors ${
                              isComplete 
                                ? "text-emerald-600 dark:text-emerald-400" 
                                : isActive
                                ? "text-primary"
                                : "text-muted-foreground/60"
                            }`} />
                          </div>
                          <div>
                            <p className={`font-semibold ${isActive ? "text-primary" : ""}`}>
                              {step.name}
                            </p>
                            {step.message && (
                              <p className="text-sm text-muted-foreground">{step.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="relative flex items-center gap-3">
                          {step.count !== undefined && (
                            <span className="text-sm font-semibold bg-muted px-2.5 py-1 rounded-full">
                              {step.count}
                            </span>
                          )}
                          {getStepStatus(step)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Summary Card */}
          {result?.summary && !runPipeline.isPending && (
            <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-emerald-50/50 to-background dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-background overflow-hidden animate-scale-in">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
              <CardHeader className="relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/15 ring-4 ring-emerald-500/10">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-emerald-800 dark:text-emerald-200">
                      Pipeline Complete! 🎉
                    </CardTitle>
                    <CardDescription className="text-emerald-700/70 dark:text-emerald-300/70">
                      Finished in {formatDuration(result.summary.duration)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 20, label: "Jobs Scraped", icon: Search },
                    { value: result.summary.matchesFound, label: "Matches", icon: Target },
                    { value: result.summary.draftsCreated, label: "Drafts", icon: FileText },
                  ].map((stat, i) => (
                    <div 
                      key={stat.label}
                      className="text-center p-5 bg-background/80 backdrop-blur rounded-xl border-2 border-emerald-200/50 dark:border-emerald-800/30 hover:scale-105 transition-transform"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <stat.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                      <p className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-primary bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <Button 
                    onClick={() => navigate("/inbox")} 
                    size="lg"
                    className="gap-2 h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    View Your Matches
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {runPipeline.isError && (
            <Card className="border-2 border-destructive/50 animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 text-destructive">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Pipeline Failed</p>
                    <p className="text-sm text-destructive/80">
                      {runPipeline.error instanceof Error 
                        ? runPipeline.error.message 
                        : "Failed to run pipeline"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-8 animate-fade-in">
          <Card className="overflow-hidden border-2">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent pb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 ring-4 ring-primary/5">
                  <CalendarClock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Schedule Daily Pipeline</CardTitle>
                  <CardDescription>
                    Automate your job search on your terms
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
              {/* Time Preview */}
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {formatTimeDisplay(scheduleTime)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {TIMEZONES.find(tz => tz.value === scheduleTimezone)?.label || scheduleTimezone}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Time Selection */}
                <div className="space-y-3">
                  <Label htmlFor="schedule-time" className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-primary" />
                    Time to Run
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="h-12 text-lg font-medium"
                  />
                </div>

                {/* Timezone Selection */}
                <div className="space-y-3">
                  <Label htmlFor="timezone" className="flex items-center gap-2 text-sm font-semibold">
                    <Globe className="h-4 w-4 text-primary" />
                    Timezone
                  </Label>
                  <Select value={scheduleTimezone} onValueChange={setScheduleTimezone}>
                    <SelectTrigger id="timezone" className="h-12">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          <span className="flex items-center justify-between gap-4">
                            <span>{tz.label}</span>
                            <span className="text-xs text-muted-foreground">{tz.offset}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weekday Selection */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Days to Run
                </Label>
                <div className="flex justify-center gap-2">
                  {WEEKDAYS.map((day, index) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => handleDayToggle(day.id)}
                        className={`relative w-12 h-12 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-110 ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted border-2 border-transparent hover:border-primary/20"
                        }`}
                        title={day.full}
                      >
                        {day.label}
                        {isSelected && (
                          <div className="absolute inset-0 rounded-full ring-4 ring-primary/20 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {selectedDays.length === 0 
                    ? "Select at least one day" 
                    : selectedDays.length === 7 
                    ? "Running every day" 
                    : `Running ${selectedDays.length} days per week`}
                </p>
              </div>

              {/* Email Notification */}
              <div className="space-y-3">
                <Label htmlFor="notification-email" className="flex items-center gap-2 text-sm font-semibold">
                  <Bell className="h-4 w-4 text-primary" />
                  Notification Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="notification-email"
                    type="email"
                    placeholder="your@email.com"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="h-12 pl-12 text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive a daily summary of your top matched jobs
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <Button 
                  onClick={handleSaveSchedule} 
                  size="lg"
                  className={`w-full h-14 text-base font-semibold transition-all ${
                    scheduleSaved 
                      ? "bg-emerald-600 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30" 
                      : "shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  }`}
                  disabled={selectedDays.length === 0}
                >
                  {scheduleSaved ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Schedule Saved Successfully!
                    </>
                  ) : (
                    <>
                      <CalendarClock className="h-5 w-5 mr-2" />
                      Save Schedule
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="rounded-xl bg-gradient-to-br from-muted/80 to-muted/40 border-2 border-dashed p-5">
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 h-fit">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Coming Soon</p>
                    <p className="text-sm text-muted-foreground">
                      When enabled, Autoply will automatically scrape job boards, match positions to your profile, 
                      and email you a personalized summary at your scheduled time.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
