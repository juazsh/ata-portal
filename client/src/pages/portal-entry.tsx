"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useLocation } from "wouter"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import logoImage from "@/assets/images/new_logo.png"

interface PortalAccountFormData {
  password: string
  confirmPassword: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
}

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
]

const PortalEntryForm = () => {
  const params = useParams<{ rid: string }>()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [formData, setFormData] = useState<PortalAccountFormData>({
    password: "",
    confirmPassword: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States"
  })

  useEffect(() => {
    const verifyRegistrationId = async () => {
      try {
        const response = await fetch(`/api/verify-registration/${params.rid}`, {
          method: "GET",
        })

        if (!response.ok) {
          const data = await response.json()
          setErrorMessage(data.message || "Link expired or account already created for this registration ID")
          setShowErrorModal(true)
        }
      } catch (error) {
        console.error("Verification error:", error)
        setErrorMessage("Failed to verify registration. Please try again.")
        setShowErrorModal(true)
      } finally {
        setIsVerifying(false)
      }
    }

    if (params.rid) {
      verifyRegistrationId()
    }
  }, [params.rid])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStateChange = (value: string) => {
    setFormData(prev => ({ ...prev, state: value }))
  }

  const isPasswordValid = (password: string) => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
  }

  const isFormValid = () => {
    return (
      formData.password.trim() !== "" &&
      isPasswordValid(formData.password) &&
      formData.password === formData.confirmPassword &&
      formData.address1.trim() !== "" &&
      formData.city.trim() !== "" &&
      formData.state.trim() !== "" &&
      formData.zipCode.trim() !== "" &&
      formData.country.trim() !== "" &&
      /^\d{5}(-\d{4})?$/.test(formData.zipCode)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/create-portal-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId: params.rid,
          password: formData.password,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Account creation failed")
      }

      setShowSuccessModal(true)
    } catch (error) {
      console.error("Account creation error:", error)
      toast({
        title: "Account Creation Failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    setLocation("/")
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-lg">Verifying registration...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <img
            src={logoImage}
            alt="STEM Masters Logo"
            width={240}
            height={120}
            className="object-contain h-20"
          />
          <div className="mt-6">
            <h2 className="text-3xl font-bold">Create Your Portal Account</h2>
            <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
            <p className="text-lg mt-4">
              Complete your registration by creating your account
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Please provide your account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Security</h3>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={
                      formData.password && !isPasswordValid(formData.password)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formData.password && !isPasswordValid(formData.password) && (
                    <p className="text-red-500 text-sm">
                      Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-sm">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="address1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={handleStateChange}
                      value={formData.state}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">
                      ZIP/Postal Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="12345"
                      required
                      className={
                        formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode) && (
                      <p className="text-red-500 text-sm">Please enter a valid ZIP code</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      disabled
                      required
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid() || isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <DialogTitle className="text-center text-2xl">
              Link Expired
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="text-base">{errorMessage}</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => setLocation("/")}
              className="w-full sm:w-auto"
            >
              Return to Homepage
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-center text-2xl">
              Account Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="text-base">
                Your portal account has been created successfully. You can now log in with your credentials.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleSuccessClose}
              className="w-full sm:w-auto"
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PortalEntryForm