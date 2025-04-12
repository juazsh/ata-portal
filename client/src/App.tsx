import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />

      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/students" component={Dashboard} />
      <ProtectedRoute path="/add-location" component={Dashboard} />
      <ProtectedRoute path="/payment-info" component={Dashboard} />
      <ProtectedRoute path="/transaction-history" component={Dashboard} />
      <ProtectedRoute path="/account-info" component={Dashboard} />
      <ProtectedRoute path="/contact" component={Dashboard} />
      <ProtectedRoute path="/progress" component={Dashboard} />
      <ProtectedRoute path="/classes" component={Dashboard} />
      <ProtectedRoute path="/add-teacher" component={Dashboard} />
      <ProtectedRoute path="/add-student" component={Dashboard} />

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