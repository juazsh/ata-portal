import { useState, useEffect } from "react";
import { Route, useLocation, useRoute } from "wouter";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { Announcements } from "@/components/dashboard/announcements";
import { Calendar } from "@/components/dashboard/calendar";
import StudentMenu from "@/components/dashboard/student-menu";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  BarChartIcon
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentMethodModal } from "@/components/dashboard/payment-method-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { is } from "drizzle-orm";

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
  const [isProgramsMatch] = useRoute("/programs");

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
        {isProgramsMatch && <ProgramsPage />}
        {isAccountInfoMatch && <AccountInfoPage />}
        {isContactMatch && <ContactPage />}
        {isProgressMatch && <ProgressPage />}
        {isClassesMatch && <ClassesPage />}
        {isAddTeacherMatch && <AddTeacherPage />}
        {isAddStudentMatch && <AddStudentPage />}

        {!isRootMatch &&
          !isStudentsMatch &&
          !isAddLocationMatch &&
          !isPaymentInfoMatch &&
          !isTransactionHistoryMatch &&
          !isProgramsMatch &&
          !isAccountInfoMatch &&
          !isContactMatch &&
          !isProgressMatch &&
          !isClassesMatch &&
          !isAddTeacherMatch &&
          !isAddStudentMatch && <HomePage />}
      </main>
    </div>
  );
}

// >> Dashboard Home Page component
// >> we need to move this to a separate file as a component
function HomePage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const { toast } = useToast();
  const [confirmRemove, setConfirmRemove] = useState({
    open: false,
    id: null,
  });

  const fetchPaymentMethods = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/payments/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePaymentMethod = async () => {
    if (!confirmRemove.id) return;

    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/payments/${confirmRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to remove payment method');
      }

      setPaymentMethods(prevMethods =>
        prevMethods.filter(method => method.id !== confirmRemove.id)
      );

      toast({
        title: "Success",
        description: "Payment method removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || 'Failed to remove payment method',
        variant: "destructive"
      });
    } finally {
      setConfirmRemove({ open: false, id: null });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.fullName || 'User'}!`}
        badge={user?.role ? { text: user.role.toUpperCase(), variant: "outline" } : undefined}
      >
        <Button variant="default" className="flex items-center gap-2">
          <RefreshIcon className="h-4 w-4" />
          Refresh Data
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>View your student details and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Name</h3>
                  <p className="text-lg font-semibold">{user?.fullName || "Not available"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Level</h3>
                  <p className="text-lg font-semibold">Intermediate</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Location</h3>
                  <p className="text-lg font-semibold">Main Campus</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Progress</h3>
                  <p className="text-lg font-semibold">78%</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Progress Overview</h3>
                <div className="h-32 bg-slate-50 dark:bg-slate-800 rounded-md p-2">
                  <SmallProgressChart />
                </div>
              </div>
            </div>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage your payment information</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse h-16"></div>
                </div>
              ) : paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium capitalize">
                            {method.cardType} •••• {method.last4}
                            {method.isDefault && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary py-0.5 px-2 rounded-full">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Expires {method.expirationDate}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmRemove({ open: true, id: method.id })}
                        aria-label="Remove payment method"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-md text-center">
                  <CreditCardIcon className="h-12 w-12 mx-auto text-primary mb-2 opacity-50" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    You don't have any payment methods yet
                  </p>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentMethodModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchPaymentMethods}
      />

      <ConfirmDialog
        open={confirmRemove.open}
        onOpenChange={(open) => setConfirmRemove({ ...confirmRemove, open })}
        title="Remove Payment Method"
        description="Are you sure you want to remove this payment method? This action cannot be undone."
        confirmText="Remove"
        onConfirm={handleRemovePaymentMethod}
      />
    </div>
  );
}


function StudentsPage() {
  return <StudentMenu />;
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


function SmallProgressChart() {

  const data = [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 72 },
    { month: 'Mar', score: 68 },
    { month: 'Apr', score: 75 },
    { month: 'May', score: 78 },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 300 100" className="w-full h-full">

        <line x1="30" y1="90" x2="290" y2="90" stroke="currentColor" strokeOpacity="0.2" />
        <line x1="30" y1="10" x2="30" y2="90" stroke="currentColor" strokeOpacity="0.2" />


        <polyline
          points="
            50,${90 - data[0].score * 0.8} 
            100,${90 - data[1].score * 0.8} 
            150,${90 - data[2].score * 0.8} 
            200,${90 - data[3].score * 0.8} 
            250,${90 - data[4].score * 0.8}
          "
          fill="none"
          stroke="hsl(215, 100%, 50%)"
          strokeWidth="2"
        />


        {data.map((point, i) => {
          const x = 50 + i * 50;
          const y = 90 - point.score * 0.8;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="hsl(215, 100%, 50%)"
            />
          );
        })}


        {data.map((point, i) => {
          const x = 50 + i * 50;
          return (
            <text
              key={i}
              x={x}
              y="100"
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              fillOpacity="0.6"
            >
              {point.month}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function PaymentInfoPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Payment Information"
        description="Manage your payment methods and billing preferences"
      >
        <Button variant="outline" className="flex items-center gap-2">
          <CreditCardIcon className="h-4 w-4" />
          Add Payment Method
        </Button>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Your saved payment methods for tuition and fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <CreditCardIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Payment methods will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function TransactionHistoryPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Transaction History"
        description="View your complete payment history and transaction details"
      >
        <Button variant="outline" className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4" />
          Export History
        </Button>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            A record of all your past payments and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <HistoryIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Transaction history will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgramsPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Programs"
        description="Available Programs on FusionMind"
      >
        {/* <Button variant="outline" className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4" />
          Export History
        </Button> */}
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Our Amazing Offerings</CardTitle>
          <CardDescription>
            See our available programs and courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <BookIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Programs will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function AccountInfoPage() {
  const { user } = useAuth();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="My Account"
        description="Manage your personal information and settings"
        badge={user?.role ? { text: user.role.toUpperCase(), variant: "outline" } : undefined}
      >
        <Button variant="outline" className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          Edit Profile
        </Button>
      </PageHeader>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-32 h-32 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="h-16 w-16 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</h3>
                  <p className="text-lg font-semibold">{user?.fullName || "Not available"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Username</h3>
                  <p className="text-lg font-semibold">{user?.username || "Not available"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</h3>
                  <p className="text-lg font-semibold">{user?.email || "Not available"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</h3>
                  <p className="text-lg font-semibold capitalize">{user?.role || "Not available"}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex gap-2">
                <Button variant="default">Edit Profile</Button>
                <Button variant="outline">Change Password</Button>
              </div>
            </div>
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