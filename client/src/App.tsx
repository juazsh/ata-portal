import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import EnrollmentPage from "@/pages/enrollment-page";
import MarathonPage from "./pages/marathon-page";
import SprintPage from "./pages/sprint-page";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "@/lib/protected-route";
import FinalizeEnrollment from "./pages/enrollment-finalize";
import DemoClassRegistration from "./pages/demo-registration";
import PortalEntryForm from "./pages/portal-entry";
import ForgotPasswordPage from "@/pages/forget-password";
import VerifyPasswordPage from "./pages/verify-password";
import StudentEnrollmentDetails from "@/pages/student-enrollment-details";


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/enroll" component={EnrollmentPage} />
      <Route path="/marathon" component={MarathonPage} />
      <Route path="/sprint" component={SprintPage} />
      <Route path="/finalize/:pid" component={FinalizeEnrollment} />
      <Route path="/demo-registration" component={DemoClassRegistration} />
      <Route path="/portal-entry/:rid" component={PortalEntryForm} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/verify-password" component={VerifyPasswordPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/students" component={Dashboard} />
      <ProtectedRoute path="/add-location" component={Dashboard} />
      <ProtectedRoute path="/payment-info" component={Dashboard} />
      <ProtectedRoute path="/transaction-history" component={Dashboard} />
      <ProtectedRoute path="/account-info" component={Dashboard} />
      <ProtectedRoute path="/contact" component={Dashboard} />
      <ProtectedRoute path="/progress" component={Dashboard} />
      <ProtectedRoute path="/classes" component={Dashboard} />
      <ProtectedRoute path="/programs" component={Dashboard} />
      <ProtectedRoute path="/add-teacher" component={Dashboard} />
      <ProtectedRoute path="/add-student" component={Dashboard} />
      <ProtectedRoute path="/class-sessions" component={Dashboard} />
      <ProtectedRoute path="/discount-codes" component={Dashboard} />
      <ProtectedRoute path="/student/:username/enrollment/:enrollmentId" component={Dashboard} /> 


      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;