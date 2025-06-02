import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";
import {
  GraduationCapIcon,
  MapPinIcon,
  BarChartIcon,
  AwardIcon,
  CalendarIcon,
  ClockIcon,
  BookIcon,
  PlusCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  BookOpenIcon,
  LayersIcon,
  BookmarkIcon
} from "lucide-react";
import AddStudentTabsForm from "@/components/dashboard/AddStudentTabsForm";

interface Achievement {
  id?: string;
  title: string;
  icon: string;
}

interface ClassInfo {
  name: string;
  teacher: string;
  time: string;
  room: string;
}

interface ModuleProgressData {
  moduleId: string;
  moduleName: string;
  completedTopics: number;
  totalTopics: number;
  completionPercentage: number;
  marks: number;
}

interface ProgramProgressData {
  programId: string;
  programName: string;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
}

interface CompletedTopic {
  topicId: string;
  topicName: string;
  completedAt: string;
  score: number;
}

interface ProgressData {
  moduleProgress: ModuleProgressData[];
  programProgress: ProgramProgressData[];
  completedTopics: CompletedTopic[];
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  location?: string;
  level?: string;
  progress?: number;
  achievements?: Achievement[];
  currentClass?: ClassInfo;
  nextClass?: ClassInfo;
  dateOfBirth?: string;
  email?: string;
}

function AchievementBadge({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 m-2 bg-primary-50 dark:bg-slate-800 rounded-lg w-24">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-xs text-center font-medium">{title}</div>
    </div>
  );
}

function ClassCard({ classData, isNext = false }) {
  if (!classData) return null;

  return (
    <Card className={isNext ? "bg-slate-50 dark:bg-slate-900" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{classData.name}</CardTitle>
          {isNext && (
            <Badge variant="outline" className="bg-primary-50 text-primary-700">
              Upcoming
            </Badge>
          )}
        </div>
        <CardDescription>{classData.teacher}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-slate-500" />
            <span>{classData.time}</span>
          </div>
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2 text-slate-500" />
            <span>{classData.room}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramEnrollmentCard({ programData }: { programData: ProgramProgressData[] }) {
  if (!programData || programData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookmarkIcon className="h-5 w-5 mr-2 text-primary" />
            Program Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-500">
            <p>Not enrolled in any program</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookmarkIcon className="h-5 w-5 mr-2 text-primary" />
          Program Enrollment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {programData.map((program) => (
          <div key={program.id || program.programId} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-lg">{program.name || program.programName}</h3>
                <p className="text-sm text-slate-500">
                  {program.completedModules} of {program.totalModules} modules completed
                </p>
              </div>
              <Badge variant="outline" className="bg-primary-50 text-primary-700">
                Active
              </Badge>
            </div>
            <div className="mt-3">
              <Progress value={program.completionPercentage} className="h-2" />
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>Progress</span>
                <span>{program.completionPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
function ModuleProgressChart({ data }: { data: ModuleProgressData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="text-center text-slate-500">
          <AlertCircleIcon className="h-10 w-10 mx-auto mb-2" />
          <p>No module progress data available yet</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name || item.moduleName || `Module ${(item.id || item.moduleId).substring(0, 4)}...`,
    completion: item.completionPercentage,
    score: item.marks
  }));

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completion" name="Completion %" fill="#4f46e5" />
          <Bar dataKey="score" name="Score" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModulePerformanceChart({ data }: { data: ModuleProgressData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="text-center text-slate-500">
          <AlertCircleIcon className="h-10 w-10 mx-auto mb-2" />
          <p>No module performance data available yet</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name || item.moduleName || `Module ${(item.id || item.moduleId).substring(0, 4)}...`,
    performance: item.marks
  }));

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="performance" name="Performance Score" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StudentDetails({ student, progressData }: { student: Student; progressData?: ProgressData }) {
  if (!student) return null;

  const programProgress = progressData?.programs || progressData?.programProgress || [];

  const overallProgress = programProgress && programProgress.length > 0
    ? programProgress[0].completionPercentage
    : 0;

  const moduleProgress = progressData?.modules || progressData?.moduleProgress || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <MapPinIcon className="h-6 w-6 mb-2 text-primary" />
          <h3 className="text-sm font-medium text-slate-500">Location</h3>
          <p className="text-lg font-medium text-center">{student.location || "Not assigned"}</p>
        </div>

        <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <GraduationCapIcon className="h-6 w-6 mb-2 text-primary" />
          <h3 className="text-sm font-medium text-slate-500">Level</h3>
          <p className="text-lg font-medium">{student.level || "Not assigned"}</p>
        </div>

        <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <BarChartIcon className="h-6 w-6 mb-2 text-primary" />
          <h3 className="text-sm font-medium text-slate-500">Overall Progress</h3>
          <div className="w-full mt-2">
            <Progress value={overallProgress} className="h-2" />
            <p className="text-center mt-1">{overallProgress.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Program Enrollment Card - Updated to handle API response */}
      <ProgramEnrollmentCard programData={programProgress} />

      {moduleProgress && moduleProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BookOpenIcon className="h-5 w-5 mr-2 text-primary" />
              Module Progress
            </CardTitle>
            <CardDescription>
              Student's current completion percentage across all modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModuleProgressChart data={moduleProgress} />
          </CardContent>
        </Card>
      )}

      {moduleProgress && moduleProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <LayersIcon className="h-5 w-5 mr-2 text-primary" />
              Module Performance
            </CardTitle>
            <CardDescription>
              Student's performance scores across different modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModulePerformanceChart data={moduleProgress} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AwardIcon className="h-5 w-5 mr-2 text-primary" />
            Achievements & Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center md:justify-start">
            {student.achievements && student.achievements.length > 0 ? (
              student.achievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.id || `achievement-${index}`}
                  title={achievement.title}
                  icon={achievement.icon}
                />
              ))
            ) : (
              <p className="text-center w-full text-slate-500">No achievements yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="flex items-center text-lg font-medium mb-4">
            <BookIcon className="h-5 w-5 mr-2 text-primary" />
            Current Class
          </h3>
          {student.currentClass ? (
            <ClassCard classData={student.currentClass} />
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="text-center text-slate-500">No current class assigned</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h3 className="flex items-center text-lg font-medium mb-4">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
            Next Class
          </h3>
          {student.nextClass ? (
            <ClassCard classData={student.nextClass} isNext={true} />
          ) : (
            <Card className="bg-slate-50 dark:bg-slate-900">
              <CardContent className="py-6">
                <p className="text-center text-slate-500">No upcoming class scheduled</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentMenu() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [progressData, setProgressData] = useState<{ [key: string]: ProgressData }>({});
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/students?parentId=${user?.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          throw new Error('Session expired. Please log in again.');
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data) && data.length === 0) {
          setStudents([]);
          setSelectedStudent(null);
        } else {
          setStudents(data);
          if (data.length > 0 && !selectedStudent) {
            setSelectedStudent(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Failed to load students. Please try again later.");

        toast({
          title: "Error",
          description: err.message || "Failed to load students.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchStudents();
    }
  }, [user?.id]);

  useEffect(() => {
    async function fetchStudentProgress(studentId) {
      if (!studentId) return;

      try {
        setLoadingProgress(true);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/students/${studentId}/progress`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Error fetching progress: ${response.status}`);
        }

        const data = await response.json();

        console.log(`Progress data for student ${studentId}:`, data);

        setProgressData(prev => ({
          ...prev,
          [studentId]: data
        }));
      } catch (err) {
        console.error("Failed to fetch student progress:", err);
        toast({
          title: "Warning",
          description: err.message || "Could not load progress data",
          variant: "warning"
        });
      } finally {
        setLoadingProgress(false);
      }
    }

    const studentId = selectedStudent?.id || selectedStudent?._id;
    if (studentId) {
      fetchStudentProgress(studentId);
    }
  }, [selectedStudent]);

  const handleAddStudent = async (newStudent) => {
    setStudents(prevStudents => [...prevStudents, newStudent]);

    if (students.length === 0) {
      setSelectedStudent(newStudent);
    }

    return newStudent;
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Student Dashboard"
        description="View and manage your student's progress and classes"
        className="mb-6"
      >
        <Button onClick={() => setShowAddModal(true)} className="flex items-center">
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <LoaderIcon className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p>Loading student data...</p>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="max-w-md mx-auto p-6">
            <GraduationCapIcon className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium mb-2">No students found</h3>
            <p className="text-slate-500 mb-6">
              You haven't added any students yet. Get started by adding your first student.
            </p>
            <Button onClick={() => setShowAddModal(true)} className="flex items-center mx-auto">
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Add Your First Student
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {students.length > 1 && (
            <Tabs
              defaultValue={selectedStudent?.id || selectedStudent?._id}
              value={selectedStudent?.id || selectedStudent?._id}
              onValueChange={(value) => {
                const student = students.find((s) => s.id === value || s._id === value);
                if (student) {
                  setSelectedStudent(student);
                }
              }}
              className="mb-6"
            >
              <TabsList className="mb-4">
                {students.map((student) => {
                  const studentId = student.id || student._id;
                  return (
                    <TabsTrigger key={studentId} value={studentId}>
                      {student.firstName} {student.lastName}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          )}

          {selectedStudent && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                {loadingProgress && (
                  <div className="flex items-center text-slate-500">
                    <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                    <span>Loading progress...</span>
                  </div>
                )}
              </div>

              <StudentDetails
                student={selectedStudent}
                progressData={progressData[selectedStudent.id || selectedStudent._id]}
              />
            </>
          )}
        </div>
      )}

      <AddStudentTabsForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddStudent={handleAddStudent}
      />
    </div>
  );
}