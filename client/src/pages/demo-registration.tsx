"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import logoImage from "@/assets/images/new_logo.png"

interface DemoRegistrationFormData {
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  studentFirstName: string
  studentLastName: string
  studentDOB: string
  demoClassDate: Date | undefined
}

const DemoClassRegistration = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState<DemoRegistrationFormData>({
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPhone: "",
    studentFirstName: "",
    studentLastName: "",
    studentDOB: "",
    demoClassDate: undefined,
  })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, demoClassDate: date }))
  }


  const isValidAge = (dateString: string) => {
    if (!dateString) return false

    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age >= 6 && age <= 18
  }


  const isValidDemoDate = (date: Date | undefined) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date > today
  }

  const isFormValid = () => {
    return (
      formData.parentFirstName.trim() !== "" &&
      formData.parentLastName.trim() !== "" &&
      formData.parentEmail.trim() !== "" &&
      emailRegex.test(formData.parentEmail) &&
      formData.parentPhone.trim() !== "" &&
      phoneRegex.test(formData.parentPhone) &&
      formData.studentFirstName.trim() !== "" &&
      formData.studentLastName.trim() !== "" &&
      formData.studentDOB.trim() !== "" &&
      isValidAge(formData.studentDOB) &&
      formData.demoClassDate !== undefined &&
      isValidDemoDate(formData.demoClassDate)
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
      const response = await fetch("/api/demo-registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentFirstName: formData.parentFirstName,
          parentLastName: formData.parentLastName,
          parentEmail: formData.parentEmail,
          parentPhone: formData.parentPhone,
          studentFirstName: formData.studentFirstName,
          studentLastName: formData.studentLastName,
          studentDOB: formData.studentDOB,
          demoClassDate: formData.demoClassDate?.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      setShowSuccessModal(true)
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred during registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <h2 className="text-3xl font-bold">Demo Class Registration</h2>
            <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
            <p className="text-lg mt-4">
              Register for a free demo class to experience our program
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registration Details</CardTitle>
            <CardDescription>
              Please provide your information to register for a demo class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Parent Information</h3>

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

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentEmail"
                    name="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    required
                    className={
                      formData.parentEmail && !emailRegex.test(formData.parentEmail)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formData.parentEmail && !emailRegex.test(formData.parentEmail) && (
                    <p className="text-red-500 text-sm">Please enter a valid email address</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentPhone"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="(123) 456-7890"
                    required
                    className={
                      formData.parentPhone && !phoneRegex.test(formData.parentPhone)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formData.parentPhone && !phoneRegex.test(formData.parentPhone) && (
                    <p className="text-red-500 text-sm">Please enter a valid phone number</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Student Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentFirstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="studentFirstName"
                      name="studentFirstName"
                      value={formData.studentFirstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentLastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="studentLastName"
                      name="studentLastName"
                      value={formData.studentLastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentDOB">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentDOB"
                    name="studentDOB"
                    type="date"
                    value={formData.studentDOB}
                    onChange={handleChange}
                    required
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 6)).toISOString().split('T')[0]}
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={
                      formData.studentDOB && !isValidAge(formData.studentDOB)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formData.studentDOB && !isValidAge(formData.studentDOB) && (
                    <p className="text-red-500 text-sm">Student must be between 6 and 18 years old</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Demo Class Date</h3>

                <div className="space-y-2">
                  <Label>Choose a Date <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.demoClassDate && "text-muted-foreground",
                          formData.demoClassDate && !isValidDemoDate(formData.demoClassDate) && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.demoClassDate ? (
                          format(formData.demoClassDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.demoClassDate}
                        onSelect={handleDateChange}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date <= today || date < new Date("1900-01-01")
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {formData.demoClassDate && !isValidDemoDate(formData.demoClassDate) && (
                    <p className="text-red-500 text-sm">Please select a future date for the demo class</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid() || isLoading}
              >
                {isLoading ? "Registering..." : "Register for Demo Class"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-center text-2xl">
              Registration Successful!
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="text-base">
                Thank you for registering for a demo class! A confirmation email has been sent to{" "}
                <span className="font-medium">{formData.parentEmail}</span>.
              </p>
              <p className="mt-4 text-base">
                We look forward to seeing you on{" "}
                {formData.demoClassDate && format(formData.demoClassDate, "PPP")}.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                window.location.href = "/"
              }}
              className="w-full sm:w-auto"
            >
              Return to Homepage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DemoClassRegistration