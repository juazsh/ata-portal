"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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
  Legend,
} from "recharts"
import {
  GraduationCapIcon,
  MapPinIcon,
  BarChartIcon,
  AwardIcon,
  PlusCircleIcon,
  LoaderIcon,
  BookOpenIcon,
  TrendingUpIcon,
  StarIcon,
  Users,
  Eye,
  ArrowRight,
} from "lucide-react"
import AddStudentTabsForm from "@/components/dashboard/add-student-tabs-form"
import { useLocation } from "wouter"

interface Achievement {
  id?: string
  title: string
  icon: string
}

interface ClassInfo {
  name: string
  teacher: string
  time: string
  room: string
}

interface ModuleProgressData {
  moduleId: string
  moduleName: string
  completedTopics: number
  totalTopics: number
  completionPercentage: number
  marks: number
}

interface ProgramProgressData {
  programId: string
  programName: string
  completedModules: number
  totalModules: number
  completionPercentage: number
}

interface CompletedTopic {
  topicId: string
  topicName: string
  completedAt: string
  score: number
}

interface ProgressData {
  moduleProgress: ModuleProgressData[]
  programProgress: ProgramProgressData[]
  completedTopics: CompletedTopic[]
}

interface Topic {
  _id: string
  name: string
  description: string
  estimatedDuration: number
  taughtBy?: string
}

interface Module {
  _id: string
  name: string
  description: string
  estimatedDuration: number
  topics: Topic[]
}

interface Program {
  _id: string
  name: string
  description: string
  price: number
  estimatedDuration: number
  image?: string
  offering: {
    _id: string
    name: string
    description: string
    description2?: string
  }
  modules: Module[]
}

interface Enrollment {
  _id: string
  programId: Program
  offeringType: "Marathon" | "Sprint"
  classSessions: string[]
  autoPayEnabled?: boolean
  nextPaymentDueDate?: string
  monthlyDueAmount?: number
  lastAmountPaid: number
  lastPaymentDate?: string
  lastPaymentTransactionId?: string
  lastPaymentMethod: string
  lastPaymentStatus: string
  createdAt: string
  paymentHistory?: {
    amount: number
    date: string
    status: string
    processor: string
    transactionId: string
  }[]
}

interface Student {
  id: string
  firstName: string
  lastName: string
  location?: string
  level?: string
  progress?: number
  achievements?: Achievement[]
  currentClass?: ClassInfo
  nextClass?: ClassInfo
  dateOfBirth?: string
  email?: string
  enrollments?: Enrollment[]
}

function AchievementBadge({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="group relative">
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 rounded-xl border border-primary/20 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer min-w-[100px]">
        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{icon}</div>
        <div className="text-xs text-center font-medium text-foreground leading-tight">{title}</div>
      </div>
    </div>
  )
}

function ModuleProgressChart({ data }: { data: ModuleProgressData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center text-muted-foreground">
          <BarChartIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <h4 className="font-medium text-foreground">No Progress Data</h4>
          <p className="text-sm">Module progress will appear here once available</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name:
      (item as any).name ||
      (item as any).moduleName ||
      `Module ${((item as any).id || (item as any).moduleId || "").substring(0, 4)}...`,
    completion: (item as any).completionPercentage,
    score: (item as any).marks,
  }))

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis domain={[0, 100]} fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="completion" name="Completion %" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          <Bar dataKey="score" name="Score" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ModulePerformanceChart({ data }: { data: ModuleProgressData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center text-muted-foreground">
          <TrendingUpIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <h4 className="font-medium text-foreground">No Performance Data</h4>
          <p className="text-sm">Performance metrics will appear here once available</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name:
      (item as any).name ||
      (item as any).moduleName ||
      `Module ${((item as any).id || (item as any).moduleId || "").substring(0, 4)}...`,
    performance: (item as any).marks,
  }))

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis domain={[0, 100]} fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="performance"
            name="Performance Score"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function StudentDetails({
  student,
  enrollments,
  progressData,
}: {
  student: Student
  enrollments?: Enrollment[]
  progressData?: ProgressData
}) {
  const [, navigate] = useLocation()

  if (!student) return null

  const programProgress = (progressData as any)?.programs || (progressData as any)?.programProgress || []
  const overallProgress = programProgress && programProgress.length > 0 ? programProgress[0].completionPercentage : 0
  const moduleProgress = (progressData as any)?.modules || (progressData as any)?.moduleProgress || []

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-xl font-bold">{student.location || "Not assigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-chart-2/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <GraduationCapIcon className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Level</p>
                <p className="text-xl font-bold">{student.level || "Not assigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-chart-3/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <BarChartIcon className="h-6 w-6 text-chart-3" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <div className="flex items-center gap-3 mt-2">
                  <Progress value={overallProgress} className="h-2 flex-1" />
                  <span className="text-xl font-bold">{overallProgress.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Section */}
      {enrollments && enrollments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Active Enrollments</h3>
            </div>
            <Badge variant="outline" className="text-sm">
              {enrollments.length} {enrollments.length === 1 ? "Program" : "Programs"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment: Enrollment) => {
              const program = enrollment.programId
              const username = `${(student as any).firstName?.toLowerCase() || ""}${
                (student as any).lastName?.toLowerCase() || ""
              }`
              return (
                <Card
                  key={enrollment._id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/50"
                  onClick={() => navigate(`/student/${username}/enrollment/${enrollment._id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center flex-shrink-0">
                        {program.image ? (
                          <img
                            src={program.image || "/placeholder.svg"}
                            alt={program.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpenIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{program.name}</CardTitle>
                        <CardDescription className="truncate">{program.offering?.name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={enrollment.offeringType === "Marathon" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {enrollment.offeringType}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">View Details</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Enrolled:</span>
                        <span className="font-medium">{new Date(enrollment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Program Fee:</span>
                        <span className="font-medium">${program.price}</span>
                      </div>
                      {enrollment.nextPaymentDueDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Next Due:</span>
                          <span className="font-medium">
                            {new Date(enrollment.nextPaymentDueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Progress Charts */}
      {moduleProgress && moduleProgress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChartIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Module Progress</CardTitle>
                  <CardDescription>Completion percentage across all modules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ModuleProgressChart data={moduleProgress} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <CardTitle className="text-lg">Performance Trends</CardTitle>
                  <CardDescription>Performance scores across different modules</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ModulePerformanceChart data={moduleProgress} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AwardIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Achievements & Badges</CardTitle>
              <CardDescription>Recognition for outstanding performance and milestones</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {student.achievements && student.achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {student.achievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.id || `achievement-${index}`}
                  title={achievement.title}
                  icon={achievement.icon}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-6 bg-muted/30 rounded-full mb-4">
                <StarIcon className="h-12 w-12 text-muted-foreground opacity-40" />
              </div>
              <h4 className="text-lg font-medium">No Achievements Yet</h4>
              <p className="text-muted-foreground max-w-md mx-auto">
                Achievements will appear here as your student progresses through their programs and reaches important
                milestones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function StudentMenu() {
  const { user } = useAuth()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [progressData, setProgressData] = useState<{ [key: string]: ProgressData }>({})
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const { toast } = useToast()
  const [, navigate] = useLocation()

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("auth_token")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`/api/students?parentId=${user?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          localStorage.removeItem("auth_token")
          throw new Error("Session expired. Please log in again.")
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (data && Array.isArray(data) && data.length === 0) {
          setStudents([])
          setSelectedStudent(null)
        } else {
          setStudents(data as Student[])
          if (data.length > 0 && !selectedStudent) {
            setSelectedStudent(data[0])
          }
        }
      } catch (err) {
        console.error("Failed to fetch students:", err)
        const errorMsg = (err as Error).message || "Failed to load students."
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchStudents()
    }
  }, [user?.id])

  useEffect(() => {
    async function fetchStudentProgress(studentId: string) {
      if (!studentId) return

      try {
        setLoadingProgress(true)

        const token = localStorage.getItem("auth_token")
        if (!token) {
          throw new Error("No authentication token found")
        }

        const response = await fetch(`/api/students/${studentId}/progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.message || `Error fetching progress: ${response.status}`)
        }

        const data = await response.json()

        setProgressData((prev) => ({
          ...prev,
          [studentId]: data,
        }))
      } catch (err) {
        console.error("Failed to fetch student progress:", err)
        const errorMsg = (err as Error).message || "Could not load progress data"
        toast({
          title: "Warning",
          description: errorMsg,
          variant: "destructive",
        })
      } finally {
        setLoadingProgress(false)
      }
    }

    const studentId = (selectedStudent as any)?.id || (selectedStudent as any)?._id
    if (studentId) {
      fetchStudentProgress(studentId)
    }
  }, [selectedStudent])

  const handleAddStudent = async (newStudent: Student) => {
    setStudents((prevStudents) => [...prevStudents, newStudent])

    if (students.length === 0) {
      setSelectedStudent(newStudent)
    }

    return newStudent
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground">Monitor your student's academic progress and achievements</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6">
          <PlusCircleIcon className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Loading Student Data</h3>
            <p className="text-muted-foreground">Please wait while we fetch your student information...</p>
          </div>
        </div>
      ) : students.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 bg-primary/10 rounded-full mb-6">
              <GraduationCapIcon className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Welcome to Your Student Dashboard</h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              You haven't added any students yet. Get started by adding your first student to begin tracking their
              academic journey.
            </p>
            <Button onClick={() => setShowAddModal(true)} size="lg" className="flex items-center gap-2">
              <PlusCircleIcon className="h-5 w-5" />
              Add Your First Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Student Tabs */}
          {students.length > 1 && (
            <Card className="p-1">
              <Tabs
                defaultValue={(selectedStudent as any)?.id || (selectedStudent as any)?._id}
                value={(selectedStudent as any)?.id || (selectedStudent as any)?._id}
                onValueChange={(value) => {
                  const student = students.find((s) => (s as any).id === value || (s as any)._id === value)
                  if (student) {
                    setSelectedStudent(student)
                  }
                }}
              >
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 h-12 bg-muted/50">
                  {students.map((student) => {
                    const studentId = (student as any).id || (student as any)._id
                    return (
                      <TabsTrigger
                        key={studentId}
                        value={studentId}
                        className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Users className="h-4 w-4" />
                        <span className="truncate">
                          {(student as any).firstName} {(student as any).lastName}
                        </span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
            </Card>
          )}

          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h2>
                  <p className="text-muted-foreground">Academic progress and enrollment details</p>
                </div>
                {loadingProgress && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading progress data...</span>
                  </div>
                )}
              </div>

              <StudentDetails
                student={selectedStudent}
                enrollments={selectedStudent.enrollments}
                progressData={progressData[(selectedStudent as any).id || (selectedStudent as any)._id]}
              />
            </div>
          )}
        </div>
      )}

      <AddStudentTabsForm isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleAddStudent} />
    </div>
  )
}
