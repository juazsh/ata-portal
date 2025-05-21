import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserIcon, BookOpenIcon, CheckCircleIcon, PercentIcon, GraduationCapIcon, SearchIcon, CalendarIcon, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  parentId: string;
  enrollments: Enrollment[];
  level?: string;
  progress?: number;
}

interface Program {
  id: string;
  name: string;
  description: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
  completedTopics: number;
  totalTopics: number;
  completionPercentage: number;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  score?: number;
}

interface Enrollment {
  id: string;
  programId: string;
  studentId: string;
  program: Program;
  paymentStatus: string;
}

export function StudentManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentModules, setStudentModules] = useState<Module[]>([]);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [addStudentData, setAddStudentData] = useState({
    programId: "",
    studentFirstName: "",
    studentLastName: "",
    studentEmail: "",
    studentDOB: "",
    classSessionId: "",
  });
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("program");
  const [completedTabs, setCompletedTabs] = useState<string[]>(["program"]);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  useEffect(() => {
    const UserRole = {
      ADMIN: "admin",
      OWNER: "owner",
      STUDENT: "student",
    };

    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.OWNER) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive"
      });
      return;
    }
    fetchPrograms();
    fetchStudents();
  }, [user]);

  useEffect(() => {
    if (selectedProgram !== "all") {
      fetchStudentsByProgram(selectedProgram);
    } else {
      fetchStudents();
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (addStudentData.programId) {
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch programs');
      }

      const data = await response.json();
      setPrograms(data);
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load programs",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');

      console.log('Fetching all students with token:', token);

      const response = await fetch('/api/students/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch students');
      }

      const data = await response.json();
      console.log('Received students data:', data);

      const studentsWithTransformedData = data.map((student: any) => ({
        ...student,
        id: student._id || student.id
      }));

      setStudents(studentsWithTransformedData);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load students",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentsByProgram = async (programId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');

      console.log('Fetching students for program:', programId);

      const response = await fetch(`/api/programs/${programId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch students for program');
      }

      const data = await response.json();
      console.log('Received students data:', data);

      const studentsWithTransformedData = data.map((student: any) => ({
        ...student,
        id: student._id || student.id
      }));

      setStudents(studentsWithTransformedData);
    } catch (error: any) {
      console.error('Error fetching students by program:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load students for this program",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentDetails = async (student: Student) => {
    try {
      setLoadingModules(true);
      const token = localStorage.getItem('auth_token');
      console.log('Fetching details for student:', student);

      const progressResponse = await fetch(`/api/students/${student.id}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let progressData = null;
      if (progressResponse.ok) {
        progressData = await progressResponse.json();
        console.log('Student progress data:', progressData);
        setStudentProgress(progressData);
      }

      const modules: Module[] = [];

      if (progressData && progressData.programs) {
        for (const programProgress of progressData.programs) {
          console.log('Processing program:', programProgress);

          const programResponse = await fetch(`/api/programs/${programProgress.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (programResponse.ok) {
            const programData = await programResponse.json();
            console.log('Full program data:', programData);

            for (const moduleIdObj of programData.modules) {
              const moduleId = moduleIdObj._id ? moduleIdObj._id.toString() : moduleIdObj;
              console.log('Fetching module:', moduleId);

              const moduleResponse = await fetch(`/api/modules/${moduleId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (moduleResponse.ok) {
                const moduleData = await moduleResponse.json();
                console.log('Module data:', moduleData);

                const moduleProgress = progressData.modules?.find((m: any) => m.id === moduleId);

                const moduleWithTopics = {
                  ...moduleData,
                  id: moduleData._id ? moduleData._id.toString() : moduleData.id,
                  topics: [],
                  completedTopics: moduleProgress?.completedTopics || 0,
                  totalTopics: moduleProgress?.totalTopics || 0,
                  completionPercentage: moduleProgress?.completionPercentage || 0,
                  marks: moduleProgress?.marks || 0
                };

                for (const topicIdObj of moduleData.topics) {
                  const topicId = topicIdObj._id ? topicIdObj._id.toString() : topicIdObj;

                  const topicResponse = await fetch(`/api/topics/${topicId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });

                  if (topicResponse.ok) {
                    const topicData = await topicResponse.json();
                    const completedTopic = progressData?.completedTopics?.find(
                      (ct: any) => ct.topicId === topicId
                    );

                    moduleWithTopics.topics.push({
                      ...topicData,
                      id: topicData._id ? topicData._id.toString() : topicData.id,
                      completed: !!completedTopic,
                      completedAt: completedTopic?.completedAt,
                      score: completedTopic?.score
                    });
                  }
                }

                modules.push(moduleWithTopics);
              }
            }
          }
        }
      }

      console.log('Final modules data:', modules);
      setStudentModules(modules);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast({
        title: "Error",
        description: "Failed to load student details",
        variant: "destructive"
      });
    } finally {
      setLoadingModules(false);
    }
  };
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailDialogOpen(true);
    fetchStudentDetails(student);
  };

  const handleTopicCompletion = async (studentId: string, topicId: string, score?: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/students/${studentId}/topics/${topicId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score })
      });

      if (!response.ok) throw new Error('Failed to update topic completion');

      if (selectedStudent) {
        fetchStudentDetails(selectedStudent);
      }

      toast({
        title: "Success",
        description: "Topic completion status updated",
      });
    } catch (error) {
      console.error('Error updating topic completion:', error);
      toast({
        title: "Error",
        description: "Failed to update topic completion",
        variant: "destructive"
      });
    }
  };

  const handleAddStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddStudentData(prev => ({ ...prev, [name]: value }));
  };

  const isProgramStepValid = !!addStudentData.programId;
  const isStudentStepValid = !!addStudentData.studentFirstName && !!addStudentData.studentLastName && !!addStudentData.studentDOB;
  const isSessionStepValid = !!selectedSessionId;

  const handleSelectProgram = (programId: string) => {
    console.log("programId", programId);
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

  const handleTabChange = (tab: string) => {
    if (completedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  };

  const handleAddStudentSubmit = async () => {
    setIsSubmitting(true);
    setAddError("");
    setAddSuccess("");
    try {
      // 1. Create enrollment
      const token = localStorage.getItem('auth_token');
      const enrollmentRes = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          programId: addStudentData.programId,
          student: {
            firstName: addStudentData.studentFirstName,
            lastName: addStudentData.studentLastName,
            dob: addStudentData.studentDOB,
          },
          classSessionId: selectedSessionId,
        })
      });
      if (!enrollmentRes.ok) {
        const err = await enrollmentRes.json();
        throw new Error(err.message || 'Failed to create enrollment');
      }
      const enrollment = await enrollmentRes.json();
      // 2. Process payment (using parent profile info)
      const paymentRes = await fetch(`/api/enrollments/${enrollment.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!paymentRes.ok) {
        const err = await paymentRes.json();
        throw new Error(err.message || 'Payment failed');
      }
      setAddSuccess('Student enrolled and payment processed successfully!');
      setIsAddStudentOpen(false);
      setActiveTab("program");
      setAddStep(1);
      setAddStudentData({ programId: "", studentFirstName: "", studentLastName: "", studentEmail: "", studentDOB: "", classSessionId: "" });
      setSelectedSessionId("");
      fetchStudents(); // Refresh list
    } catch (err: any) {
      setAddError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>
            View and manage student progress and assessments
          </CardDescription>
          {(user?.role === "admin" || user?.role === "owner") && (
            <Button className="mt-4" onClick={() => setIsAddStudentOpen(true)}>
              Add Student
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {process.env.NODE_ENV === 'development' && (
              <div className="p-2 bg-gray-100 rounded text-sm">
                <p>User role: {user?.role}</p>
                <p>Auth token: {localStorage.getItem('auth_token') ? 'Present' : 'Missing'}</p>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-[200px]">
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse h-20"></div>
                ))}
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleStudentClick(student)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {student.email}
                        </p>
                        {student.level && (
                          <Badge variant="secondary" className="mt-1">
                            {student.level}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {student.enrollments && student.enrollments.length > 0 && (
                        <div className="flex gap-2">
                          {student.enrollments.map((enrollment, index) => index < 2 && (
                            <Badge key={enrollment.id} variant="outline">
                              {enrollment.program?.name || 'Program'}
                            </Badge>
                          ))}
                          {student.enrollments.length > 2 && (
                            <Badge variant="outline">+{student.enrollments.length - 2}</Badge>
                          )}
                        </div>
                      )}
                      {student.progress !== undefined && (
                        <div className="flex items-center gap-2">
                          <PercentIcon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{student.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-md text-center">
                <UserIcon className="h-12 w-12 mx-auto text-primary mb-2 opacity-50" />
                <p className="text-slate-600 dark:text-slate-400">
                  No students found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Student Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                  {selectedStudent.level && (
                    <Badge className="mt-1">{selectedStudent.level}</Badge>
                  )}
                </div>
              </div>

              {studentProgress && (
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Total Programs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold">{studentProgress.programs?.length || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Completed Topics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold">{studentProgress.completedTopics?.length || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Active Modules</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-2xl font-bold">{studentProgress.modules?.length || 0}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {loadingModules ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse h-20"></div>
                  ))}
                </div>
              ) : studentModules.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {studentModules.map((module) => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <BookOpenIcon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{module.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={module.completionPercentage} className="w-24" />
                            <span className="text-sm font-medium">{module.completionPercentage}%</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-6 pt-2 space-y-3">
                          {module.topics.map((topic) => (
                            <div
                              key={topic.id}
                              className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <CheckCircleIcon
                                  className={`h-5 w-5 ${topic.completed ? 'text-green-500' : 'text-gray-300'}`}
                                />
                                <div>
                                  <p className="font-medium">{topic.name}</p>
                                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                                  {topic.completedAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Completed on {new Date(topic.completedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={topic.score || ''}
                                  onChange={(e) => {
                                    const score = parseInt(e.target.value);
                                    if (!isNaN(score) && score >= 0 && score <= 100) {
                                      handleTopicCompletion(selectedStudent.id, topic.id, score);
                                    }
                                  }}
                                  placeholder="Score"
                                  className="w-20"
                                />
                                <Button
                                  variant={topic.completed ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleTopicCompletion(selectedStudent.id, topic.id, topic.score)}
                                >
                                  {topic.completed ? "Mark Incomplete" : "Mark Complete"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-md text-center">
                  <GraduationCapIcon className="h-12 w-12 mx-auto text-primary mb-2 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No modules found for this student
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
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
                    key={p.id}
                    className={`cursor-pointer border-2 transition-colors ${addStudentData.programId === p._id ? 'border-primary ring-2 ring-primary' : 'border-slate-200 hover:border-primary/50'}`}
                    onClick={() => handleSelectProgram(p._id)}
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
                  <strong>Program:</strong> {programs.find(p => p.id === addStudentData.programId)?.name}
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
    </>
  );
}