import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { Announcements } from "@/components/dashboard/announcements";
import { Calendar } from "@/components/dashboard/calendar";
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

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 pt-16 overflow-x-hidden bg-slate-50 dark:bg-slate-950 min-h-screen">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/students" component={StudentsPage} />
          <Route path="/add-location" component={AddLocationPage} />
          <Route path="/payment-info" component={PaymentInfoPage} />
          <Route path="/transaction-history" component={TransactionHistoryPage} />
          <Route path="/account-info" component={AccountInfoPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/classes" component={ClassesPage} />
          <Route path="/add-teacher" component={AddTeacherPage} />
          <Route path="/add-student" component={AddStudentPage} />
          <Route path="/logout">
            {() => {
              // Handle logout redirect
              useEffect(() => {
                handleLogout();
              }, []);
              return <div>Logging out...</div>;
            }}
          </Route>
          <Route>
            <HomePage />
          </Route>
        </Switch>
      </main>
    </div>
  );
}

// Dashboard Home Page component
function HomePage() {
  const { user } = useAuth();
  
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

      <StatsCards />
      <RecentActivities />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Announcements />
        </div>
        <div>
          <Calendar />
        </div>
      </div>
    </div>
  );
}

// Students Page component
function StudentsPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader 
        title="Students" 
        description="View and manage all students in the system"
      >
        <Button variant="outline" className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Add New Student
        </Button>
      </PageHeader>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            You can add, edit, or remove students from here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
            <GraduationCapIcon className="h-12 w-12 mx-auto text-primary mb-2" />
            <p>Student list will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add Location Page component
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

// Payment Info Page component
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

// Transaction History Page component
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

// Account Info Page component
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

// Contact Page component
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

// Progress Page component
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

// Classes Page component
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

// Add Teacher Page component
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

// Add Student Page component
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
