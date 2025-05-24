"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormData } from "./enrollment-types"

interface ParentInfoFormProps {
  formData: FormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setActiveTab: (tab: string) => void
  onExistingUserDetected: (email: string) => void
  setFormData: (data: FormData) => void
}

export function ParentInfoForm({
  formData,
  handleChange,
  setActiveTab,
  onExistingUserDetected,
  setFormData
}: ParentInfoFormProps) {
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [isEmailVerified, setIsEmailVerified] = useState(false)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/

  const isParentInfoComplete = () => {
    return (
      formData.parentFirstName.trim() !== "" &&
      formData.parentLastName.trim() !== "" &&
      formData.parentEmail.trim() !== "" &&
      emailRegex.test(formData.parentEmail) &&
      formData.parentPhone.trim() !== "" &&
      phoneRegex.test(formData.parentPhone) &&
      !emailError &&
      isEmailVerified && 
      !isCheckingEmail 
    )
  }

  const handleChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e)

    if (e.target.name === "parentEmail") {
      setEmailError("")
      setIsEmailVerified(false)
    }
  }

  const verifyEmail = async (email: string) => {
    if (!emailRegex.test(email)) return

    setIsCheckingEmail(true)
    setIsEmailVerified(false)
    
    try {
      const response = await fetch(`/api/users/verify/email?email=${encodeURIComponent(email)}`)

      if (!response.ok) {
        throw new Error("Failed to verify email")
      }

      const data = await response.json()

      if (data.exists) {
        setEmailError("This email is already registered. Please use a different email or log in.")
        setIsEmailVerified(false)
        onExistingUserDetected(email)
      } else {
        setEmailError("")
        setIsEmailVerified(true)
      }
    } catch (error) {
      console.error("Error verifying email:", error)
      setEmailError("Failed to verify email. Please try again.")
      setIsEmailVerified(false)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.parentEmail && emailRegex.test(formData.parentEmail)) {
        verifyEmail(formData.parentEmail)
      } else {
        setIsEmailVerified(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.parentEmail])

  const handleContinue = async () => {
    if (!isParentInfoComplete()) return;
    
    if (!formData.stripeCustomerId) {
      try {
        const res = await fetch("/api/stripe/create-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.parentEmail,
            name: `${formData.parentFirstName} ${formData.parentLastName}`
          })
        });
        const data = await res.json();
        if (res.ok && data.customerId) {
          setFormData({ ...formData, stripeCustomerId: data.customerId });
        }
      } catch (err) {
        
      }
    }
    setActiveTab("child");
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Parent Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentFirstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="parentFirstName"
            name="parentFirstName"
            value={formData.parentFirstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentLastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="parentLastName"
            name="parentLastName"
            value={formData.parentLastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="parentEmail">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="parentEmail"
            name="parentEmail"
            type="email"
            value={formData.parentEmail}
            onChange={handleChangeWithValidation}
            required
            className={
              (formData.parentEmail && !emailRegex.test(formData.parentEmail)) || emailError
                ? "border-red-500"
                : isEmailVerified
                ? "border-green-500"
                : ""
            }
          />
          {isCheckingEmail && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 border-t-2 border-blue-500 border-r-2 rounded-full animate-spin"></div>
            </div>
          )}
          {isEmailVerified && !isCheckingEmail && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 text-green-500">✓</div>
            </div>
          )}
        </div>
        {formData.parentEmail && !emailRegex.test(formData.parentEmail) && (
          <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>
        )}
        {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
        {isEmailVerified && !emailError && (
          <p className="text-green-600 text-sm mt-1">Email verified</p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="parentPhone">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="parentPhone"
          name="parentPhone"
          value={formData.parentPhone}
          onChange={handleChangeWithValidation}
          placeholder="(123) 456-7890"
          required
          className={
            formData.parentPhone && !phoneRegex.test(formData.parentPhone)
              ? "border-red-500"
              : ""
          }
        />
        {formData.parentPhone && !phoneRegex.test(formData.parentPhone) && (
          <p className="text-red-500 text-sm mt-1">Please enter a valid phone number</p>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
          Back to Enrollment Details
        </Button>
        <Button type="button" onClick={handleContinue} disabled={!isParentInfoComplete()}>
          Continue to Student Info
        </Button>
      </div>
    </div>
  )
}