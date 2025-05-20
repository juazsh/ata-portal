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
import { CheckCircle, AlertCircle, CalendarIcon, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import logoImage from "@/assets/images/new_logo.png"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Updated ClassSession interface with capacity fields
interface ClassSession {
  id: string;
  program_id?: string;
  weekday: string;
  start_time: string;
  end_time: string;
  type: "weekday" | "weekend";
  total_capacity: number;
  available_capacity: number;
  total_demo_capacity: number;
  available_demo_capacity: number;
}

interface PortalAccountFormData {
  password: string
  confirmPassword: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  selectedSessions: ClassSession[]
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

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [formData, setFormData] = useState<PortalAccountFormData>({
    password: "",
    confirmPassword: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    selectedSessions: []
  })

  // Add state for available class sessions
  const [availableSessions, setAvailableSessions] = useState<ClassSession[]>([])
  const [sessionLoading, setSessionLoading] = useState(false)
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    const verifyRegistrationId = async () => {
      try {
        const response = await fetch(`/api/registrations/${params.rid}`, {
          method: "GET",
        })

        if (!response.ok) {
          const data = await response.json()
          setErrorMessage(data.message || "Registration not found")
          setShowErrorModal(true)
          return
        }

        const registration = await response.json()

        if (registration.isRegistrationComplete || registration.isRegLinkedWithEnrollment || registration.isUserSetup) {
          setErrorMessage("Link expired or account already created for this registration ID")
          setShowErrorModal(true)
          return
        }

        setRegistrationData(registration)


        if (registration.programId) {
          fetchAvailableSessions(registration.programId)
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


  const fetchAvailableSessions = async (programId: string) => {
    setSessionLoading(true)
    try {
      const response = await fetch(`/api/class-sessions?program_id=${programId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch class sessions")
      }

      const data = await response.json()
      setAvailableSessions(data.sessions || [])
    } catch (error) {
      console.error("Error fetching class sessions:", error)
      toast({
        title: "Error",
        description: "Unable to load available class sessions. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSessionLoading(false)
    }
  }

  // Check if a session is at capacity
  const isSessionAtCapacity = (session: ClassSession) => {
    return session.available_capacity <= 0
  }

  // Handle session selection
  const handleSessionSelection = (session: ClassSession) => {
    // If session is at capacity, don't allow selection
    if (isSessionAtCapacity(session)) {
      toast({
        title: "Session Unavailable",
        description: "This session has reached its capacity. Please select another session.",
        variant: "destructive",
      })
      return
    }

    // Check if session is already selected
    const isSelected = formData.selectedSessions.some(s => s.id === session.id)

    if (isSelected) {
      // Remove from selection
      const newSessions = formData.selectedSessions.filter(s => s.id !== session.id)
      setFormData(prev => ({
        ...prev,
        selectedSessions: newSessions
      }))

      // Update selected days
      const newDays = new Set(selectedDays)
      newDays.delete(session.weekday)
      setSelectedDays(newDays)
    } else {
      // Check if we can add this day (only one session per day)
      if (selectedDays.has(session.weekday)) {
        toast({
          title: "Same Day Selection",
          description: "You cannot select multiple sessions on the same day. Please select a session on a different day.",
          variant: "warning",
        })
        return
      }

      // Determine if we can add more sessions (limit based on program type)
      const isTwiceAWeek = registrationData?.programName?.toLowerCase().includes("twice")
      const maxSessions = isTwiceAWeek ? 2 : 1

      if (formData.selectedSessions.length >= maxSessions) {
        // Replace the first selected session if we already have max sessions
        toast({
          title: "Session Selection Limited",
          description: `You can only select ${maxSessions} session(s) for this program.`,
          variant: "default",
        })

        // Remove the first session and its day
        const oldSession = formData.selectedSessions[0]
        const newSessions = [...formData.selectedSessions.slice(1), session]

        setFormData(prev => ({
          ...prev,
          selectedSessions: newSessions
        }))

        // Update selected days
        const newDays = new Set(selectedDays)
        if (oldSession) {
          newDays.delete(oldSession.weekday)
        }
        newDays.add(session.weekday)
        setSelectedDays(newDays)
      } else {
        // Add to selection
        setFormData(prev => ({
          ...prev,
          selectedSessions: [...prev.selectedSessions, session]
        }))

        // Add the day to selected days
        const newDays = new Set(selectedDays)
        newDays.add(session.weekday)
        setSelectedDays(newDays)
      }
    }
  }

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
    // Determine required number of sessions based on program type
    const isTwiceAWeek = registrationData?.programName?.toLowerCase().includes("twice")
    const requiredSessionCount = isTwiceAWeek ? 2 : 1

    return (
      formData.password.trim() !== "" &&
      isPasswordValid(formData.password) &&
      formData.password === formData.confirmPassword &&
      formData.address1.trim() !== "" &&
      formData.city.trim() !== "" &&
      formData.state.trim() !== "" &&
      formData.zipCode.trim() !== "" &&
      formData.country.trim() !== "" &&
      /^\d{5}(-\d{4})?$/.test(formData.zipCode) && // US ZIP code validation
      formData.selectedSessions.length === requiredSessionCount // Ensure correct number of sessions are selected
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Determine required number of sessions based on program type
    const isTwiceAWeek = registrationData?.programName?.toLowerCase().includes("twice")
    const requiredSessionCount = isTwiceAWeek ? 2 : 1

    if (!isFormValid()) {
      toast({
        title: "Incomplete Form",
        description: `Please fill in all required fields correctly and select ${requiredSessionCount} class session(s).`,
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
          classSessions: formData.selectedSessions.map(session => session.id), // Send only the session IDs
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Account creation failed")
      }

      if (data.studentUsername) {
        localStorage.setItem('studentUsername', data.studentUsername)
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
    setLocation("/auth")
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-lg">Verifying registration...</div>
      </div>
    )
  }

  // Format time string to more readable format (e.g., "14:30" to "2:30 PM")
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Calculate capacity percentage
  const getCapacityPercentage = (available: number, total: number) => {
    if (total === 0) return 0
    return Math.round(((total - available) / total) * 100)
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
            {registrationData && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded">
                    REGISTRATION INFO
                  </span>
                  <h4 className="font-semibold">Please verify this is your registration</h4>
                </div>
                <p className="text-sm mb-1">
                  <span className="font-medium">Parent Name:</span> {registrationData.parentFirstName} {registrationData.parentLastName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {registrationData.parentEmail}
                </p>
                {registrationData.programName && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">Program:</span> {registrationData.programName}
                  </p>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Security</h3>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={
                        formData.password && !isPasswordValid(formData.password)
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className={
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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

              {/* Class Session Selection Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Class Session Selection <span className="text-red-500">*</span>
                </h3>
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  {sessionLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse text-lg">Loading available sessions...</div>
                    </div>
                  ) : availableSessions.length === 0 ? (
                    <div className="py-4 text-center text-slate-600 dark:text-slate-400">
                      No class sessions are currently available for this program.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center mb-4 gap-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Select {registrationData?.programName?.toLowerCase().includes("twice") ? "two sessions" : "one session"} that work best for your schedule:
                        </p>
                        <Badge variant="outline" className="ml-auto">
                          {formData.selectedSessions.length} / {registrationData?.programName?.toLowerCase().includes("twice") ? "2" : "1"} selected
                        </Badge>
                      </div>

                      {/* Important notes */}
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-amber-800 dark:text-amber-300">
                            <p className="font-medium">Important:</p>
                            <ul className="list-disc pl-4 mt-1 space-y-1">
                              <li>You cannot select multiple sessions on the same day</li>
                              <li>Once selected, your sessions cannot be changed without contacting support</li>
                              <li>Session capacity is limited and available on a first-come, first-served basis</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {availableSessions.map((session) => {
                          const isSelected = formData.selectedSessions.some(s => s.id === session.id)
                          const capacityPercentage = getCapacityPercentage(session.available_capacity, session.total_capacity)
                          const isFull = isSessionAtCapacity(session)

                          return (
                            <div
                              key={session.id}
                              className={`p-3 rounded-md border transition-colors ${isFull
                                ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-75 cursor-not-allowed"
                                : isSelected
                                  ? "bg-primary/20 border-primary cursor-pointer"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50 cursor-pointer"
                                }`}
                              onClick={() => !isFull && handleSessionSelection(session)}
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <div>
                                  <div className="font-medium">{session.weekday}</div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400">
                                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={session.type === "weekday" ? "default" : "secondary"} className="text-xs">
                                      {session.type === "weekday" ? "Weekday" : "Weekend"}
                                    </Badge>
                                    {isFull && (
                                      <Badge variant="destructive" className="text-xs">
                                        Full
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 w-full sm:w-32">
                                  <div className="flex justify-between items-center text-xs">
                                    <span>Capacity:</span>
                                    <span>{session.available_capacity} of {session.total_capacity} available</span>
                                  </div>
                                  <Progress value={capacityPercentage} className="h-2" />
                                  {isSelected && (
                                    <div className="flex justify-end mt-1">
                                      <CheckCircle className="h-5 w-5 text-primary" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {formData.selectedSessions.length === 0 && (
                        <p className="text-sm mt-4 text-amber-600 dark:text-amber-400">
                          Please select {registrationData?.programName?.toLowerCase().includes("twice") ? "two sessions" : "one session"} to continue.
                        </p>
                      )}
                    </>
                  )}
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
                Your portal account has been created successfully. Please check your email for login credentials.
              </p>
              <p className="mt-2 text-base">
                You will now be redirected to the login page.
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