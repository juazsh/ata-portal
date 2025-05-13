import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Program } from "@/components/enrollment/enrollment-types";

interface ClassSession {
  id: string;
  program_id?: string;
  weekday: string;
  start_time: string;
  end_time: string;
  type: "weekday" | "weekend";
  regular_capacity: number;
  capacity_demo: number;
}

interface ClassSessionCalendarProps {
  program: Program | null;
  isProgramLoading: boolean;
  selectedSessions: ClassSession[];
  setSelectedSessions: React.Dispatch<React.SetStateAction<ClassSession[]>>;
  setActiveTab: (tab: string) => void;
}

const ClassSessionCalendar: React.FC<ClassSessionCalendarProps> = ({
  program,
  isProgramLoading,
  selectedSessions,
  setSelectedSessions,
  setActiveTab,
}) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Determine max sessions based on program type
  const getMaxSessionsAllowed = () => {
    if (!program) return 0;

    const isMarathon = program.offering.name.includes("Marathon");
    if (!isMarathon) return 1; // Sprint programs only allow one session

    const isTwiceAWeek = program.name.toLowerCase().includes("twice");
    return isTwiceAWeek ? 2 : 1; // Marathon: twice a week = 2 sessions, once a week = 1 session
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  const fetchSessions = async () => {
    if (isProgramLoading || !program) return;

    try {
      setIsLoading(true);
      setError("");

      const isMarathon = program.offering.name.includes("Marathon");
      let url = "/api/class-sessions";

      // For Marathon programs, get sessions with no program_id 
      // For Sprint programs, get sessions with matching program_id
      if (!isMarathon) {
        url += `?program_id=${program._id}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Server returned ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data || !data.sessions || !Array.isArray(data.sessions)) {
        throw new Error("Invalid response format from server");
      }

      // Filter sessions for Marathon programs (should have no program_id)
      let availableSessions = isMarathon
        ? data.sessions.filter((session: ClassSession) => !session.program_id)
        : data.sessions;

      setSessions(availableSessions);
    } catch (error) {
      console.error("Error fetching class sessions:", error);
      setError(`Failed to load available class sessions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      toast({
        title: "Error loading sessions",
        description: "We couldn't load the available class sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [program, isProgramLoading, retryCount, toast]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleSelectSession = (session: ClassSession) => {
    // Check if already selected
    if (selectedSessions.some(s => s.id === session.id)) {
      setSelectedSessions(selectedSessions.filter(s => s.id !== session.id));
      return;
    }

    const maxSessions = getMaxSessionsAllowed();

    // Check if max sessions reached
    if (selectedSessions.length >= maxSessions) {
      toast({
        title: "Session limit reached",
        description: `You can only select ${maxSessions} session${maxSessions > 1 ? 's' : ''} for this program.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedSessions([...selectedSessions, session]);
  };

  const isSessionSelected = (session: ClassSession) => {
    return selectedSessions.some(s => s.id === session.id);
  };

  const continueToPayment = () => {
    if (selectedSessions.length === 0) {
      toast({
        title: "No sessions selected",
        description: "Please select at least one class session to continue.",
        variant: "destructive",
      });
      return;
    }

    const maxSessions = getMaxSessionsAllowed();
    if (selectedSessions.length !== maxSessions) {
      toast({
        title: "Session selection incomplete",
        description: `Please select ${maxSessions} session${maxSessions > 1 ? 's' : ''} to continue.`,
        variant: "destructive",
      });
      return;
    }

    setActiveTab("payment");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Select Class Session{getMaxSessionsAllowed() > 1 ? 's' : ''}</h3>
        <p className="text-muted-foreground mt-1">
          {program && program.offering.name.includes("Marathon")
            ? `Please select ${getMaxSessionsAllowed()} weekly class session${getMaxSessionsAllowed() > 1 ? 's' : ''}`
            : "Please select a class session for this program"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 flex items-center"
              onClick={handleRetry}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="flex mb-2 items-center">
            <p className="mr-1 font-medium">Selected: {selectedSessions.length}/{getMaxSessionsAllowed()}</p>
            {selectedSessions.length === getMaxSessionsAllowed() && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>

          {sessions.length === 0 && !error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No sessions available</AlertTitle>
              <AlertDescription>
                {program?.offering.name.includes("Marathon")
                  ? "No open class sessions are currently available for this program. Please contact support for assistance."
                  : "No class sessions are configured for this specific program. Please contact support for assistance."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {daysOfWeek.map((day) => {
                const daySessions = sessions.filter((session) => session.weekday === day);
                if (daySessions.length === 0) return null;

                return (
                  <Card key={day}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{day}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {daySessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-3 border rounded-md transition-colors cursor-pointer flex justify-between items-center ${isSessionSelected(session)
                              ? "border-primary bg-primary/10"
                              : "hover:border-gray-400"
                              }`}
                            onClick={() => handleSelectSession(session)}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Available Capacity: {session.regular_capacity}
                              </div>
                              {session.type === "weekend" && (
                                <Badge variant="outline" className="mt-1">Weekend</Badge>
                              )}
                            </div>
                            <div>
                              {isSessionSelected(session) && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setActiveTab("child")}
            >
              Previous
            </Button>
            <Button
              onClick={continueToPayment}
              disabled={selectedSessions.length !== getMaxSessionsAllowed()}
            >
              Continue to Payment
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ClassSessionCalendar;