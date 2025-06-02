import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AddStudentTabsForm({ isOpen, onClose, onSuccess, parentId }: { isOpen: boolean, onClose: () => void, onSuccess?: (enrollment: any) => void, parentId?: string }) {
  const [programs, setPrograms] = useState<any[]>([]);
  const [addStudentData, setAddStudentData] = useState({
    programId: "",
    studentFirstName: "",
    studentLastName: "",
    studentDOB: "",
    classSessionId: "",
  });
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [addError, setAddError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("program");
  const [completedTabs, setCompletedTabs] = useState(["program"]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (addStudentData.programId) {
      setSessionLoading(true);
      fetch(`/api/class-sessions?program_id=${addStudentData.programId}`)
        .then(res => res.json())
        .then(data => setAvailableSessions(data.sessions || []))
        .catch(() => setAvailableSessions([]))
        .finally(() => setSessionLoading(false));
    } else {
      setAvailableSessions([]);
    }
  }, [addStudentData.programId]);

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/programs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      setPrograms(data);
    } catch (e) {
      setPrograms([]);
    }
  };

  const handleAddStudentChange = (e: any) => {
    const { name, value } = e.target;
    setAddStudentData(prev => ({ ...prev, [name]: value }));
  };

  const isProgramStepValid = !!addStudentData.programId;
  const isStudentStepValid = !!addStudentData.studentFirstName && !!addStudentData.studentLastName && !!addStudentData.studentDOB;
  const isSessionStepValid = !!selectedSessionId;

  const handleSelectProgram = (programId: any) => {
    setAddStudentData(prev => ({ ...prev, programId }));
    setAddError("");
    setCompletedTabs(["program"]);
  };

  const handleTabNext = () => {
    setAddError("");
    if (activeTab === "program" && !isProgramStepValid) {
      setAddError("Please select a program.");
      return;
    }
    if (activeTab === "student" && !isStudentStepValid) {
      setAddError("Please fill all student information fields.");
      return;
    }
    if (activeTab === "session" && !isSessionStepValid) {
      setAddError("Please select a class session.");
      return;
    }
    if (activeTab === "program") {
      setActiveTab("student");
      setCompletedTabs(["program", "student"]);
    } else if (activeTab === "student") {
      setActiveTab("session");
      setCompletedTabs(["program", "student", "session"]);
    } else if (activeTab === "session") {
      setActiveTab("confirm");
      setCompletedTabs(["program", "student", "session", "confirm"]);
    }
  };

  const handleTabBack = () => {
    setAddError("");
    if (activeTab === "student") setActiveTab("program");
    else if (activeTab === "session") setActiveTab("student");
    else if (activeTab === "confirm") setActiveTab("session");
  };

  const handleTabChange = (tab: any) => {
    if (completedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  };

  const handleAddStudentSubmit = async () => {
    setIsSubmitting(true);
    setAddError("");
    try {
      const token = localStorage.getItem('auth_token');
      const enrollmentRes = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          programId: addStudentData.programId,
          student: {
            firstName: addStudentData.studentFirstName,
            lastName: addStudentData.studentLastName,
            dob: addStudentData.studentDOB,
            parentId: parentId || undefined,
          },
          classSessionId: selectedSessionId,
        })
      });
      if (!enrollmentRes.ok) {
        const err = await enrollmentRes.json();
        throw new Error((err as any).message || 'Failed to create enrollment');
      }
      const enrollment = await enrollmentRes.json();
      if (onSuccess) onSuccess(enrollment);
      if (onClose) onClose();
      setActiveTab("program");
      setAddStudentData({ programId: "", studentFirstName: "", studentLastName: "", studentDOB: "", classSessionId: "" });
      setSelectedSessionId("");
    } catch (err: any) {
      setAddError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="program" disabled={false}>Program</TabsTrigger>
            <TabsTrigger value="student" disabled={!completedTabs.includes("student")}>Student Info</TabsTrigger>
            <TabsTrigger value="session" disabled={!completedTabs.includes("session")}>Session</TabsTrigger>
            <TabsTrigger value="confirm" disabled={!completedTabs.includes("confirm")}>Confirm</TabsTrigger>
          </TabsList>
          <TabsContent value="program">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((p) => (
                <Card
                  key={p.id || p._id}
                  className={`cursor-pointer border-2 transition-colors ${addStudentData.programId === (p.id || p._id) ? 'border-primary ring-2 ring-primary' : 'border-slate-200 hover:border-primary/50'}`}
                  onClick={() => handleSelectProgram(p.id || p._id)}
                >
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {addError && <div className="text-red-500 mt-2">{addError}</div>}
            <div className="flex justify-end mt-6">
              <Button onClick={handleTabNext} disabled={!isProgramStepValid}>Next</Button>
            </div>
          </TabsContent>
          <TabsContent value="student">
            <div className="space-y-4">
              <label className="block font-medium">Student Information</label>
              <Input name="studentFirstName" placeholder="First Name" value={addStudentData.studentFirstName} onChange={handleAddStudentChange} />
              <Input name="studentLastName" placeholder="Last Name" value={addStudentData.studentLastName} onChange={handleAddStudentChange} />
              <Input name="studentDOB" placeholder="Date of Birth" type="date" value={addStudentData.studentDOB} onChange={handleAddStudentChange} />
            </div>
            {addError && <div className="text-red-500 mt-2">{addError}</div>}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleTabBack}>Back</Button>
              <Button onClick={handleTabNext} disabled={!isStudentStepValid}>Next</Button>
            </div>
          </TabsContent>
          <TabsContent value="session">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Class Session Selection <span className="text-red-500">*</span>
              </h3>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                {sessionLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse text-lg">Loading available sessions...</div>
                  </div>
                ) : availableSessions.length === 0 ? (
                  <div className="py-4 text-center text-slate-600 dark:text-slate-400">
                    No class sessions are currently available for this program.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {availableSessions.map((session) => {
                      const isSelected = selectedSessionId === (session.id || session._id);
                      const isFull = session.available_capacity <= 0;
                      const capacityPercentage = session.total_capacity === 0 ? 0 : Math.round(((session.total_capacity - session.available_capacity) / session.total_capacity) * 100);
                      return (
                        <div
                          key={session.id || session._id}
                          className={`p-3 rounded-md border transition-colors ${isFull
                            ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-75 cursor-not-allowed"
                            : isSelected
                              ? "bg-primary/20 border-primary cursor-pointer"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50 cursor-pointer"
                            }`}
                          onClick={() => !isFull && setSelectedSessionId(session.id || session._id)}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                              <div className="font-medium">{session.weekday}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {session.start_time} - {session.end_time}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={session.type === "weekday" ? "default" : "secondary"} className="text-xs">
                                  {session.type === "weekday" ? "Weekday" : "Weekend"}
                                </Badge>
                                {isFull && (
                                  <Badge variant="destructive" className="text-xs">
                                    Full
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 w-full sm:w-32">
                              <div className="flex justify-between items-center text-xs">
                                <span>Capacity:</span>
                                <span>{session.available_capacity} of {session.total_capacity} available</span>
                              </div>
                              <Progress value={capacityPercentage} className="h-2" />
                              {isSelected && (
                                <div className="flex justify-end mt-1">
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {addError && <div className="text-red-500 mt-2">{addError}</div>}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleTabBack}>Back</Button>
              <Button onClick={handleTabNext} disabled={!isSessionStepValid}>Next</Button>
            </div>
          </TabsContent>
          <TabsContent value="confirm">
            <div className="space-y-4">
              <div>
                <strong>Program:</strong> {programs.find(p => (p.id || p._id) === addStudentData.programId)?.name}
              </div>
              <div>
                <strong>Student:</strong> {addStudentData.studentFirstName} {addStudentData.studentLastName} (DOB: {addStudentData.studentDOB})
              </div>
              <div>
                <strong>Class Session:</strong> {availableSessions.find(cs => (cs.id || cs._id) === selectedSessionId)?.weekday} {availableSessions.find(cs => (cs.id || cs._id) === selectedSessionId)?.start_time} - {availableSessions.find(cs => (cs.id || cs._id) === selectedSessionId)?.end_time}
              </div>
              <div>
                <strong>Payment:</strong> Will be processed using parent profile info
              </div>
            </div>
            {addError && <div className="text-red-500 mt-2">{addError}</div>}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleTabBack}>Back</Button>
              <Button onClick={handleAddStudentSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Submit'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 