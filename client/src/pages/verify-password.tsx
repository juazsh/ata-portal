"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import logoImage from "@/assets/images/new_logo.png"

export default function VerifyPasswordPage() {
  const [location] = useLocation()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"verify" | "reset">("verify")
  const [resetId, setResetId] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get("email")
    const codeParam = urlParams.get("code")
    const resetIdParam = urlParams.get("resetId")

    if (emailParam) setEmail(emailParam)
    if (codeParam) setCode(codeParam)
    if (resetIdParam) {
      setResetId(resetIdParam)
      setStep("reset")
    }
  }, [location])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !code) {
      toast({
        title: "Error",
        description: "Please enter both email and verification code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetId(data.resetId)
        setStep("reset")
        toast({
          title: "Code Verified",
          description: "Now you can set your new password",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Invalid or expired code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying code:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/password-reset/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetId,
          email,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your password has been reset successfully",
        })
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/auth?login=true"
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reset password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">
            {step === "verify" ? "Verify Reset Code" : "Set New Password"}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === "verify" 
              ? "" 
              : "Choose a strong password for your account"
            }
          </p>
        </div>

        <Card className="shadow-lg">
          {step === "verify" ? (
            <>
              <CardHeader>
                <CardTitle>Enter Verification Code</CardTitle>
                <CardDescription>
                 Enter the 6-digit code sent to your email address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyCode} className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={isLoading}
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-xs text-gray-500">
                      Code expires in 8 hours
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Set New Password</CardTitle>
                <CardDescription>
                  Your code has been verified. Create a new secure password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500">
                      Minimum 6 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        <div className="text-center mt-6 space-y-2">
          {step === "verify" && (
            <Link href="/forgot-password" className="text-green-600 hover:text-green-700 text-sm">
              ← Didn't receive a code?
            </Link>
          )}
          <div className="text-sm text-gray-500">
            <Link href="/auth" className="text-green-600 hover:text-green-700">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}