import { useState, useEffect } from "react";
import { Route, useLocation, useRoute } from "wouter";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import StudentMenu from "@/components/dashboard/student-menu";
import ProgramManagement from "@/components/dashboard/owner-dashboard/program";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HomeIcon,
  GraduationCapIcon,
  BookOpenIcon,
  BookIcon,
  UserIcon,
  CreditCardIcon,
  HistoryIcon,
  PhoneIcon,
  LogOutIcon,
  PlusIcon,
  MapPinIcon,
  BarChartIcon,
  User
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentMethodModal } from "@/components/dashboard/payment-method-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { StudentManagement } from "@/components/dashboard/student-management";
import SessionsPage from "@/components/dashboard/owner-dashboard/session";
import PlansPage from "@/components/dashboard/owner-dashboard/plan";
import OfferingManagement from "@/components/dashboard/owner-dashboard/offering";
import DiscountCodeManagement from "@/components/dashboard/owner-dashboard/discount-code";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import StudentEnrollmentDetails from "@/pages/student-enrollment-details";
import AccountInfoPage from "@/components/dashboard/account-info-page";
import TransactionHistoryPage from "@/components/dashboard/transaction-history-page";
import PaymentInfoPage from "@/components/dashboard/payment-info-page";
import InternalUserManagement from "@/components/dashboard/owner-dashboard/user";
import LocationManagement from "@/components/dashboard/owner-dashboard/location";
import ScheduleManagement from "@/components/dashboard/owner-dashboard/schedule";

interface PaymentMethod {
  id: string;
  last4: string;
  expirationDate: string;
  cardType: string;
  isDefault: boolean;
  cardholderName?: string;
}

interface Enrollment {
  _id: string;
  programId: { name: string } | string;
  monthlyAmount?: number;
  paymentHistory?: { amount: number; date: string; status: string; transactionId: string }[];
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  location?: string;
  enrolledProgram?: string;
  level?: string;
  progress?: number;
}

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const [isRootMatch] = useRoute("/");
  const [isStudentsMatch] = useRoute("/students");
  const [isPaymentInfoMatch] = useRoute("/payment-info");
  const [isTransactionHistoryMatch] = useRoute("/transaction-history");
  const [isAccountInfoMatch] = useRoute("/account-info");
  const [isContactMatch] = useRoute("/contact");
  const [isProgressMatch] = useRoute("/progress");
  const [isClassesMatch] = useRoute("/classes");
  const [isAddTeacherMatch] = useRoute("/add-teacher");
  const [isAddStudentMatch] = useRoute("/add-student");
  const [isAddLocationMatch] = useRoute("/add-location");
  const [isDiscountCode] = useRoute("/discount-codes");
  const [isUserMatch] = useRoute("/users");
  const [isLocationMatch] = useRoute("/locations");
  const [isProgramsMatch] = useRoute("/programs");
  const [isSchedulesMatch] = useRoute("/schedules");
  const [isOfferingsMatch] = useRoute("/offerings");
  const [isSessions] = useRoute("/sessions");
  const [isPlans] = useRoute("/plans");
  const [isEnrollmentDetailsMatch] = useRoute("/student/:username/enrollment/:enrollmentId");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 pt-16 overflow-x-hidden bg-slate-50 dark:bg-slate-950 min-h-screen">
        {isRootMatch && <HomePage />}
        {isStudentsMatch && <StudentsPage />}
        {isAddLocationMatch && <AddLocationPage />}
        {isPaymentInfoMatch && <PaymentInfoPage />}
        {isTransactionHistoryMatch && <TransactionHistoryPage />}
        {isProgramsMatch && <ProgramManagement />}
        {isAccountInfoMatch && <AccountInfoPage />}
        {isContactMatch && <ContactPage />}
        {isProgressMatch && <ProgressPage />}
        {isClassesMatch && <ClassesPage />}
        {isUserMatch && <InternalUserManagement />}
        {isAddTeacherMatch && <AddTeacherPage />}
        {isAddStudentMatch && <AddStudentPage />}
        {isSessions && <SessionsPage />}
        {isPlans && <PlansPage />}
        {isLocationMatch && <LocationManagement />}
        {isOfferingsMatch && <OfferingManagement />}
        {isDiscountCode && <DiscountCodeManagement />}
        {isSchedulesMatch && <ScheduleManagement />}
        {isEnrollmentDetailsMatch && <StudentEnrollmentDetails />}

        {!isRootMatch &&
          !isStudentsMatch &&
          !isAddLocationMatch &&
          !isPaymentInfoMatch &&
          !isTransactionHistoryMatch &&
          !isProgramsMatch &&
          !isSessions &&
          !isAccountInfoMatch &&
          !isContactMatch &&
          !isProgressMatch &&
          !isClassesMatch &&
          !isAddTeacherMatch &&
          !isEnrollmentDetailsMatch &&
          !isPlans &&
          !isLocationMatch &&
          !isUserMatch &&
          !isOfferingsMatch &&
          !isDiscountCode &&
          !isSchedulesMatch &&
          !isAddStudentMatch && <HomePage />}
      </main>
    </div>
  );
}

// >> Dashboard Home Page component
// >> we need to move this to a separate file as a component
function HomePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const { toast } = useToast();
  const isParent = user?.role === 'parent';

  useEffect(() => {
    if (isParent) {
      fetchStudents();
    } else {
      setIsLoading(false);
    }
  }, [isParent, user?.id]);

  const fetchStudents = async () => {
    if (!isParent || !user?.id) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/students?parentId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load student information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.fullName || 'User'}!`}
        badge={user?.role ? { text: user.role.toUpperCase(), variant: "outline" } : undefined}
      >
        {/* <Button variant="default" className="flex items-center gap-2">
          <RefreshIcon className="h-4 w-4" />
          Refresh Data
        </Button> */}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{isParent ? "Students Information" : "Student Information"}</CardTitle>
            <CardDescription>View student details and progress</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                          <div>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                          <div>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                          <div>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                          <div>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : students.length > 0 ? (
              <div className="space-y-4">
                {students.map((student) => (
                  <Card key={student._id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {`${student.firstName} ${student.lastName}`}
                        </h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                          <div className="flex items-start gap-3">
                            <MapPinIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Location</p>
                              <p className="font-medium text-slate-900 dark:text-white">{student.location || "Not assigned"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <BookOpenIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Program</p>
                              <p className="font-medium text-slate-900 dark:text-white">{student.enrolledProgram || "Not enrolled"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <GraduationCapIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Level</p>
                              <p className="font-medium text-slate-900 dark:text-white">{student.level || "Beginner"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <BarChartIcon className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Overall Progress</p>
                              <p className="font-medium text-slate-900 dark:text-white">{student.progress || 0}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {isParent ? "No students added yet" : "No student information available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding</h3>
                  <p className="text-xl font-semibold mb-2">$350.00</p>
                  <Button size="sm" className="w-full">Make Payment</Button>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Credit</h3>
                  <p className="text-xl font-semibold mb-2">$50.00</p>
                  <Button size="sm" variant="outline" className="w-full">Add Credit</Button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Last Payment</h3>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Tuition Fee</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">March 15, 2025</p>
                    </div>
                    <p className="font-semibold">$250.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StudentsPage() {
  const { user } = useAuth();
  return user.role === "owner" ? <StudentManagement /> : <StudentMenu />;
}


function AddLocationPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Add Location"
        description="Create a new location for classes and activities"
        badge={{ text: "ADMIN", variant: "outline" }}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>New Location</CardTitle>
          <CardDescription>
            Fill out the form below with the location details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <MapPinIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Location form will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function ContactPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Contact Us</h1>
      <Card>
        <CardHeader>
          <CardTitle>Get in Touch</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Have questions or need assistance? Reach out to our support team.
          </p>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <PhoneIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Contact form will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function ProgressPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">My Progress</h1>
      <Card>
        <CardHeader>
          <CardTitle>Academic Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Track your academic progress and performance across all subjects.
          </p>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <BarChartIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Progress charts will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function ClassesPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">My Classes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            View all your enrolled classes and course materials.
          </p>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <BookOpenIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Class list will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function AddTeacherPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Add Teacher</h1>
      <Card>
        <CardHeader>
          <CardTitle>New Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Add a new teacher to your connections. Enter their details below.
          </p>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <PlusIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Teacher form will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddStudentPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Add Student</h1>
      <Card>
        <CardHeader>
          <CardTitle>New Student</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Add a new student to your connections. Enter their details below.
          </p>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <PlusIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Student form will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RefreshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}