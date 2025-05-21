"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginUserSchema } from "@shared/schema"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { z } from "zod"
import { Link } from "wouter"

type LoginFormValues = z.infer<typeof loginUserSchema>

export function LoginForm() {
  const { loginMutation } = useAuth()
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate({ ...data, rememberMe })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter email or username</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="email@example.com or username"
                  {...field}
                  autoComplete="username email"
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                    autoComplete="current-password"
                    className="bg-slate-50 dark:bg-slate-800 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember-me" className="text-sm text-slate-700 dark:text-slate-300">
              Remember me
            </Label>
          </div>
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:text-primary/80 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>

        {loginMutation.isError && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-md">
            {loginMutation.error?.message || "An error occurred during login. Please try again."}
          </div>
        )}
      </form>
    </Form>
  )
}