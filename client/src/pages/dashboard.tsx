import { useState, useEffect } from "react";
import { Route, useLocation, useRoute } from "wouter";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import StudentMenu from "@/components/dashboard/student-menu";
import ProgramsPage from "@/components/dashboard/programs/program-page"
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
import ClassSessionsPage from "@/components/class-session/class-session-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Types
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
  const [isProgramsMatch] = useRoute("/programs");
  const [isClassSessions] = useRoute("/class-sessions");

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
        {isClassSessions && <ClassSessionsPage />}


        {!isRootMatch &&
          !isStudentsMatch &&
          !isAddLocationMatch &&
          !isPaymentInfoMatch &&
          !isTransactionHistoryMatch &&
          !isProgramsMatch &&
          !isClassSessions &&
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
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const { toast } = useToast();
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [showDeleteDefaultModal, setShowDeleteDefaultModal] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [makePaymentModal, setMakePaymentModal] = useState<{ open: boolean; enrollment: Enrollment | null }>({ open: false, enrollment: null });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user?.id) {
      fetchPaymentMethods();
      fetchEnrollments();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

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

  const fetchEnrollments = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const response = await fetch('/api/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setEnrollments(data.enrollments);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load enrollments', variant: 'destructive' });
    }
  };

  const handleRemovePaymentMethod = async () => {
    if (!confirmRemove.id) return;
    if (paymentMethods.length === 1) {
      setConfirmRemove({ open: false, id: null });
      setShowDeleteDefaultModal(true);
      return;
    }

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

  const handleMakePayment = (enrollment: Enrollment, amount: number) => {
    if (amount <= 0) {
      toast({ title: 'No Outstanding', description: 'No outstanding amount to pay.', variant: 'default' });
      return;
    }
    setSelectedPaymentMethod(paymentMethods.find(m => m.isDefault)?.id || null);
    setMakePaymentModal({ open: true, enrollment });
  };

  const confirmMakePayment = async () => {
    if (!makePaymentModal.enrollment || !selectedPaymentMethod || !user?.id) return;
    setIsPaying(true);
    try {
      console.log(paymentMethods)
      const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
      if (!method) throw new Error('No payment method selected');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/enrollments/${makePaymentModal.enrollment._id}/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          enrollmentId: makePaymentModal.enrollment._id,
          paymentMethodId: method.id,
          paymentProcessor: 'stripe',
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment failed');
      toast({ title: 'Payment Success', description: data.message || 'Payment processed.' });
      setMakePaymentModal({ open: false, enrollment: null });
      fetchEnrollments();
    } catch (e: any) {
      toast({ title: 'Payment Error', description: e.message || 'Failed to process payment', variant: 'destructive' });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Payment Information"
        description="Manage your payment methods and billing preferences"
      >
        <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsAddModalOpen(true)}>
          <CreditCardIcon className="h-4 w-4" />
          Add Payment Method
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Your saved payment methods for tuition and fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse h-56"></div>
              </div>
            ) : paymentMethods.length > 0 ? (
              <div className="space-y-6">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="relative">
                    <div className="rounded-lg overflow-hidden shadow-lg h-48 bg-slate-900 bg-opacity-90 text-white relative">
                      <div className="p-6 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-xl"><i>VISA</i></span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-lg font-medium tracking-widest">
                            **** **** **** {method.last4 || '9875'}
                          </p>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-lg font-semibold">
                              {method.cardholderName || 'Not Provided'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-300">Exp Date</p>
                            <p className="text-lg font-semibold">
                              {method.expirationDate || '12/24'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmRemove({ open: true, id: method.id })}
                        aria-label="Remove payment method"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
            <CardDescription>
              Summary of your payment status and recent transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md text-center">No enrollments found.</div>
            ) : (
              enrollments.map((enrollment) => {
                const today = new Date();
                const outstanding = today.getDate() > 20 && enrollment.monthlyAmount ? enrollment.monthlyAmount : 0.0;
                const paymentHistory = (enrollment.paymentHistory || []).slice(-2).reverse();
                return (
                  <div key={enrollment._id} className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md mb-2">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Outstanding for {typeof enrollment.programId === 'object' ? enrollment.programId.name : 'Program'}</h3>
                      <p className="text-xl font-semibold mb-2">${outstanding.toFixed(2)}</p>
                      <Button size="sm" className="w-full" onClick={() => handleMakePayment(enrollment, outstanding)}>Make Payment</Button>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Recent Transactions</h3>
                      <div className="space-y-3">
                        {paymentHistory.length === 0 ? (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-center text-sm text-muted-foreground">No recent transactions.</div>
                        ) : paymentHistory.map((tx, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{tx.status === 'completed' ? 'Tuition Fee' : 'Pending Payment'}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                              </div>
                              <p className="font-semibold">${tx.amount.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 mt-2" onClick={() => navigate('/transaction-history')}>
              <HistoryIcon className="h-4 w-4" />
              View All Transactions
            </Button>
          </CardContent>
        </Card>
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
      <ConfirmDialog
        open={showDeleteDefaultModal}
        onOpenChange={setShowDeleteDefaultModal}
        title="Cannot Delete Default Payment Method"
        description="Can't delete the default payment method. Add another card, make it default and then delete this."
        confirmText="OK"
        onConfirm={() => setShowDeleteDefaultModal(false)}
        hideCancel
      />
      <Dialog open={makePaymentModal.open} onOpenChange={(open) => setMakePaymentModal({ ...makePaymentModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              <div className="mb-4">
                <div className="mb-2">Select a payment method:</div>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className={`flex items-center gap-2 p-2 rounded border ${selectedPaymentMethod === method.id ? 'border-primary' : 'border-slate-200'}`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <input type="radio" checked={selectedPaymentMethod === method.id} onChange={() => setSelectedPaymentMethod(method.id)} />
                      <span>{method.cardType} •••• {method.last4} (exp {method.expirationDate}) {method.isDefault && <span className="ml-1 text-xs text-primary">Default</span>}</span>
                    </div>
                  ))}
                </div>
              </div>
              You are about to pay for <span className="font-bold">{makePaymentModal.enrollment?.programId && typeof makePaymentModal.enrollment.programId === 'object' ? makePaymentModal.enrollment.programId.name : 'Program'}</span>.<br />
              The selected payment method will be used.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button onClick={confirmMakePayment} disabled={isPaying || !selectedPaymentMethod} className="w-full">
              {isPaying ? 'Processing...' : 'Pay'}
            </Button>
            <Button variant="outline" onClick={() => setMakePaymentModal({ open: false, enrollment: null })} className="w-full">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function TransactionHistoryPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const { toast } = useToast();
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const response = await fetch('/api/enrollments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) setEnrollments(data.enrollments);
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load enrollments', variant: 'destructive' });
      }
    };
    fetchEnrollments();
  }, [user?.id, toast]);
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Transaction History"
        description="View your complete payment history and transaction details"
      >
        {/* <Button variant="outline" className="flex items-center gap-2" style={{ display: 'none' }}>
          <HistoryIcon className="h-4 w-4" />
          Export History
        </Button> */}
      </PageHeader>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            A record of all your past payments and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">No enrollments found.</div>
          ) : (
            enrollments.map((enrollment) => (
              <div key={enrollment._id} className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
                <div className="mb-2 font-semibold">{typeof enrollment.programId === 'object' ? enrollment.programId.name : 'Program'}</div>
                <div className="space-y-3">
                  {(enrollment.paymentHistory || []).length === 0 ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md text-center text-sm text-muted-foreground">No transactions.</div>
                  ) : (
                    (enrollment.paymentHistory || []).slice().reverse().map((tx, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{tx.status === 'completed' ? 'Tuition Fee' : 'Pending Payment'}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                          </div>
                          <p className="font-semibold">${tx.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
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