"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/auth/login-form"
import { useTheme } from "@/hooks/use-theme"
import { MoonIcon, SunIcon } from "lucide-react"
import logoImage from "@/assets/images/new_logo.png";

export default function AuthPage() {
  const { user, isLoading } = useAuth()
  const [, navigate] = useLocation()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/")
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>

      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-md p-2">
              <img
                src={logoImage}
                alt="STEM Masters Logo"
                width={240}
                height={120}
                className="object-contain h-32"
              />
            </div>
          </div>
          {/* <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
            Welcome to STEM Masters
          </h1> */}
          {/* <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">A product of AletTau Technologies</p> */}
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Please log in to continue</p>
        <LoginForm />

        <div className="mt-4 text-center">
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={toggle} className="rounded-full" aria-label="Toggle theme">
              {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
