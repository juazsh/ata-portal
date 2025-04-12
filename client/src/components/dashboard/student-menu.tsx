// StudentMenu.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import {
  GraduationCapIcon,
  MapPinIcon,
  BarChartIcon,
  AwardIcon,
  CalendarIcon,
  ClockIcon,
  BookIcon
} from "lucide-react";

// I need to see how we will get this from our API
const mockStudents = [
  {
    id: "s1",
    name: "Emma Johnson",
    location: "Downtown Learning Center",
    level: "Intermediate",
    progress: 68,
    achievements: [
      { id: "a1", title: "Perfect Attendance", icon: "🏆" },
      { id: "a2", title: "Math Champion", icon: "🔢" },
      { id: "a3", title: "Reading Star", icon: "📚" }
    ],
    currentClass: {
      name: "Algebra Fundamentals",
      teacher: "Mr. Thompson",
      time: "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
      room: "Room 203"
    },
    nextClass: {
      name: "Geometry Basics",
      teacher: "Ms. Garcia",
      time: "Starting next semester",
      room: "Room 210"
    },
    progressData: [
      { month: "Jan", score: 65 },
      { month: "Feb", score: 68 },
      { month: "Mar", score: 72 },
      { month: "Apr", score: 75 },
      { month: "May", score: 82 },
      { month: "Jun", score: 87 }
    ],
    subjectProgress: [
      { subject: "Math", score: 85 },
      { subject: "Science", score: 72 },
      { subject: "English", score: 90 },
      { subject: "History", score: 78 },
      { subject: "Art", score: 95 }
    ]
  },
  {
    id: "s2",
    name: "Noah Johnson",
    location: "Westside Education Center",
    level: "Advanced",
    progress: 92,
    achievements: [
      { id: "a1", title: "Science Project Winner", icon: "🔬" },
      { id: "a2", title: "Public Speaking Award", icon: "🎤" },
      { id: "a3", title: "Reading Challenge", icon: "📚" },
      { id: "a4", title: "Math Competition", icon: "🔢" }
    ],
    currentClass: {
      name: "Advanced Chemistry",
      teacher: "Dr. Williams",
      time: "Tuesdays and Thursdays, 5:00 PM - 6:30 PM",
      room: "Lab 101"
    },
    nextClass: {
      name: "Physics I",
      teacher: "Dr. Martinez",
      time: "Starting next semester",
      room: "Lab 105"
    },
    progressData: [
      { month: "Jan", score: 88 },
      { month: "Feb", score: 90 },
      { month: "Mar", score: 87 },
      { month: "Apr", score: 92 },
      { month: "May", score: 94 },
      { month: "Jun", score: 95 }
    ],
    subjectProgress: [
      { subject: "Math", score: 96 },
      { subject: "Science", score: 98 },
      { subject: "English", score: 92 },
      { subject: "History", score: 87 },
      { subject: "Art", score: 85 }
    ]
  }
];


function AchievementBadge({ title, icon }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 m-2 bg-primary-50 dark:bg-slate-800 rounded-lg w-24">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-xs text-center font-medium">{title}</div>
    </div>
  );
}


function ClassCard({ classData, isNext = false }) {
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


function ProgressChart({ data }) {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SubjectsChart({ data }) {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subject" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="score" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


function StudentDetails({ student }) {
  return (
    <div className="space-y-6">
      {/* Student Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <MapPinIcon className="h-6 w-6 mb-2 text-primary" />
          <h3 className="text-sm font-medium text-slate-500">Location</h3>
          <p className="text-lg font-medium text-center">{student.location}</p>
        </div>

        <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <GraduationCapIcon className="h-6 w-6 mb-2 text-primary" />
          <h3 className="text-sm font-medium text-slate-500">Level</h3>
          <p className="text-lg font-medium">{student.level}</p>
        </div>

        <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <BarChartIcon className="h-6 w-6 mb-2 text-primary" />
          <h3 className="text-sm font-medium text-slate-500">Overall Progress</h3>
          <div className="w-full mt-2">
            <Progress value={student.progress} className="h-2" />
            <p className="text-center mt-1">{student.progress}%</p>
          </div>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress Over Time</CardTitle>
          <CardDescription>
            Monthly performance tracking and assessment results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressChart data={student.progressData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subject Performance</CardTitle>
          <CardDescription>
            Current scores across all subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectsChart data={student.subjectProgress} />
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AwardIcon className="h-5 w-5 mr-2 text-primary" />
            Achievements & Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center md:justify-start">
            {student.achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                title={achievement.title}
                icon={achievement.icon}
              />
            ))}
          </div>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="flex items-center text-lg font-medium mb-4">
            <BookIcon className="h-5 w-5 mr-2 text-primary" />
            Current Class
          </h3>
          <ClassCard classData={student.currentClass} />
        </div>

        <div>
          <h3 className="flex items-center text-lg font-medium mb-4">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
            Next Class
          </h3>
          <ClassCard classData={student.nextClass} isNext={true} />
        </div>
      </div>
    </div>
  );
}

export default function StudentMenu() {
  const { user } = useAuth();
  const [students, setStudents] = useState(mockStudents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchStudents = async () => {
      try {
        // const response = await fetchStudentsByParentId(user.id);
        // setStudents(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  if (loading) {
    return <div className="p-8">Loading student information...</div>;
  }

  if (!students || students.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="My Students"
          description="View detailed information about your students"
        />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <GraduationCapIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-medium mb-2">No Students Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
              You currently don't have any students associated with your account. If you believe this is an error, please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="My Students"
        description="View detailed information about your students"
        badge={{ text: "PARENT", variant: "outline" }}
      />

      <Tabs defaultValue={students[0].id} className="mt-6">
        <TabsList className="mb-4 w-full flex overflow-x-auto">
          {students.map((student) => (
            <TabsTrigger
              key={student.id}
              value={student.id}
              className="flex-1 min-w-fit"
            >
              {student.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {students.map((student) => (
          <TabsContent key={student.id} value={student.id} className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center">
              <GraduationCapIcon className="inline-block h-6 w-6 mr-2 text-primary" />
              {student.name}
            </h2>
            <Separator className="my-4" />
            <StudentDetails student={student} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}