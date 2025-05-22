"use client"

import { useState } from "react"
import { Link } from "wouter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import logoImage from "@/assets/images/new_logo.png"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast({
          title: "Reset Code Sent",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error requesting password reset:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src={logoImage}
              alt="STEM Masters Logo"
              className="h-12 object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <CardTitle className="text-xl">Email Sent!</CardTitle>
              <CardDescription>
                If your email is registered with us, you'll receive a password reset code shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Check your inbox for an email from STEM Masters</p>
                <p>• Click the reset link or copy the 6-digit code</p>
                <p>• The code will expire in 8 hours</p>
              </div>
              
              <div className="pt-4 space-y-3">
                <Link href="/verify-password">
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    I Have My Code
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false)
                    setEmail("")
                  }}
                >
                  Try Different Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link href="/auth" className="text-green-600 hover:text-green-700 text-sm">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={logoImage}
            alt="STEM Masters Logo"
            className="h-12 object-contain mx-auto mb-4"
          />
           <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
          {/* <p className="text-gray-600 mt-2">
            Enter your email address and we'll send you a reset code
          </p> */}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
            Enter your email address and we'll send a 6-digit verification code to your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <Link href="/auth" className="text-green-600 hover:text-green-700 text-sm">
            ← Back to Login
          </Link>
          <div className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/enroll" className="text-green-600 hover:text-green-700">
              Enroll Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}