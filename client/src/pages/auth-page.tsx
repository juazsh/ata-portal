import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";
import { useTheme } from "@/hooks/use-theme";
import { MoonIcon, SunIcon } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { theme, toggle } = useTheme();

  // $juazsh >> this will redirect the user to the home page if they are already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome to FusionMind
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            A product of AletTau Technologies
          </p>
        </div>


        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Please log in to continue
        </p>
        <LoginForm />

        <div className="mt-4 text-center">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
