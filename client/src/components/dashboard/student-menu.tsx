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
  Line
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
  LoaderIcon
} from "lucide-react";

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

interface ProgressData {
  month: string;
  score: number;
}

interface SubjectProgress {
  subject: string;
  score: number;
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
  progressData?: ProgressData[];
  subjectProgress?: SubjectProgress[];
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

function ProgressChart({ data }: { data: ProgressData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="text-center text-slate-500">
          <AlertCircleIcon className="h-10 w-10 mx-auto mb-2" />
          <p>No progress data available yet</p>
        </div>
      </div>
    );
  }

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

function SubjectsChart({ data }: { data: SubjectProgress[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="text-center text-slate-500">
          <AlertCircleIcon className="h-10 w-10 mx-auto mb-2" />
          <p>No subject data available yet</p>
        </div>
      </div>
    );
  }

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

function StudentDetails({ student }: { student: Student }) {
  if (!student) return null;

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
            <Progress value={student.progress || 0} className="h-2" />
            <p className="text-center mt-1">{student.progress || 0}%</p>
          </div>
        </div>
      </div>

      {student.progressData && student.progressData.length > 0 && (
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
      )}

      {student.subjectProgress && student.subjectProgress.length > 0 && (
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

function AddStudentModal({ isOpen, onClose, onAddStudent }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear specific error when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const studentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password
      };

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.message || `Error: ${response.status} ${response.statusText}`;


        if (response.status === 409) {
          setErrors({ email: "This email is already in use" });
          throw new Error("This email is already in use");
        } else {
          throw new Error(errorMsg);
        }
      }

      const result = await response.json();


      onAddStudent(result.student);

      toast({
        title: "Success",
        description: "Student added successfully",
        variant: "success"
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
      });

      onClose();
    } catch (error) {
      console.error("Error adding student:", error);

      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive"
      });

      if (!errors.email && !errors.submit) {
        setErrors({
          submit: error.message || "Failed to add student"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter your child's information to register them as a student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name*</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={errors.firstName ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name*</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={errors.lastName ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth*</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className={errors.dateOfBirth ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-red-500">{errors.dateOfBirth}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address*</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={errors.email ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={errors.password ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password*</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={errors.confirmPassword ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentMenu() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/students?parentId=${user?.id}`, {
          credentials: 'include'
        });

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
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to load students.",
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
          { }
          {students.length > 1 && (
            <Tabs
              defaultValue={selectedStudent?.id || selectedStudent?._id}
              value={selectedStudent?.id || selectedStudent?._id}
              onValueChange={(value) => {
                console.log("Tab value changed to:", value);
                const student = students.find((s) => s.id === value || s._id === value);
                if (student) {
                  console.log("Found student:", student);
                  setSelectedStudent(student);
                } else {
                  console.error("No student found for the selected tab value:", value);
                }
              }}
              className="mb-6"
            >
              <TabsList className="mb-4">
                {students.map((student) => {
                  const studentId = student.id || student._id;
                  if (!studentId) {
                    console.error("Student is missing an ID:", student);
                  }
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
              </div>

              <StudentDetails student={selectedStudent} />
            </>
          )}
        </div>
      )}

      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddStudent={handleAddStudent}
      />
    </div>
  );
}