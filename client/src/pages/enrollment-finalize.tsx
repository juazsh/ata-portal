"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "wouter"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

import { EnrollmentDetails } from "@/components/enrollment/enrollment-details"
import { ParentInfoForm } from "@/components/enrollment/parent-info-form"
import { StudentInfoForm } from "@/components/enrollment/student-info-form"
import { PaymentForm } from "@/components/enrollment/payment-form"
import type { Program, FormData } from "@/components/enrollment/enrollment-types"
import { InfoIcon, UserIcon, GraduationCapIcon, CreditCardIcon } from "lucide-react"

const FinalizeEnrollment = () => {
  const params = useParams<{ pid: string }>()
  const { toast } = useToast()

  const [program, setProgram] = useState<Program | null>(null)
  const [formData, setFormData] = useState<FormData>({
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPassword: "",
    parentConfirmPassword: "",
    parentPhone: "",
    parentAddress: "",
    parentCity: "",
    parentZip: "",
    parentState: "",
    parentCountry: "",
    childFirstName: "",
    childLastName: "",
    childDOB: "",
    childEmail: "",
    childPassword: "",
    childConfirmPassword: "",
    childPhone: "",
    childAddress: "",
    childCity: "",
    childZip: "",
    childState: "",
    childCountry: "",
    paymentMethod: "paypal",
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
    enrollmentDate: undefined,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isProgramLoading, setIsProgramLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [discountCode, setDiscountCode] = useState("")

  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (!params.pid) return

      try {
        setIsProgramLoading(true)
        const response = await fetch(`/api/programs/public/${params.pid}`)

        if (!response.ok) {
          throw new Error("Failed to fetch program details")
        }

        const data = await response.json()
        setProgram(data)
      } catch (error) {
        console.error("Error fetching program:", error)
        toast({
          title: "Error",
          description: "Failed to load program details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsProgramLoading(false)
      }
    }

    fetchProgramDetails()
  }, [params.pid, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({ ...prevData, [name]: value }))

    if (name === "parentPassword" || name === "parentConfirmPassword") {
      if (name === "parentPassword" && formData.parentConfirmPassword && value !== formData.parentConfirmPassword) {
        setError("Parent passwords do not match")
      } else if (name === "parentConfirmPassword" && formData.parentPassword && value !== formData.parentPassword) {
        setError("Parent passwords do not match")
      } else {
        setError("")
      }
    }

    if (name === "childPassword" || name === "childConfirmPassword") {
      if (name === "childPassword" && formData.childConfirmPassword && value !== formData.childConfirmPassword) {
        setError("Student passwords do not match")
      } else if (name === "childConfirmPassword" && formData.childPassword && value !== formData.childPassword) {
        setError("Student passwords do not match")
      } else {
        setError("")
      }
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, enrollmentDate: date })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (formData.parentPassword !== formData.parentConfirmPassword) {
      setError("Parent passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.childPassword !== formData.childConfirmPassword) {
      setError("Child passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      if (!program || !formData.enrollmentDate) {
        setError("Program information or enrollment date is missing")
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: {
            firstName: formData.parentFirstName,
            lastName: formData.parentLastName,
            email: formData.parentEmail,
            password: formData.parentPassword,
            phone: formData.parentPhone,
            address: {
              street: formData.parentAddress,
              city: formData.parentCity,
              state: formData.parentState,
              zip: formData.parentZip,
              country: formData.parentCountry,
            },
            role: "parent",
          },
          child: {
            firstName: formData.childFirstName,
            lastName: formData.childLastName,
            email: formData.childEmail,
            password: formData.childPassword,
            phone: formData.childPhone,
            address: {
              street: formData.childAddress,
              city: formData.childCity,
              state: formData.childState,
              zip: formData.childZip,
              country: formData.childCountry,
            },
            dateOfBirth: formData.childDOB,
            role: "student",
          },
          programDetails: {
            programId: program._id,
            offeringId: program.offering._id,
            startDate: formData.enrollmentDate.toISOString(),
            price: program.price,
          },
          paymentDetails: {
            method: formData.paymentMethod,
            cardDetails:
              formData.paymentMethod === "credit-card"
                ? {
                  number: formData.cardNumber,
                  expiry: formData.cardExpiry,
                  cvc: formData.cardCVC,
                }
                : undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong")
      }

      setSuccess("Registration successful! Redirecting to login...")
      setTimeout(() => {
        window.location.href = "/signin"
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  const isValidDate = (date?: Date) => {
    if (!date) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return date >= today
  }

  const isParentInfoComplete = () => {
    return (
      formData.parentFirstName.trim() !== "" &&
      formData.parentLastName.trim() !== "" &&
      formData.parentEmail.trim() !== "" &&
      formData.parentPassword.trim() !== "" &&
      formData.parentConfirmPassword.trim() !== "" &&
      formData.parentPhone.trim() !== "" &&
      formData.parentAddress.trim() !== "" &&
      formData.parentCity.trim() !== "" &&
      formData.parentZip.trim() !== "" &&
      formData.parentState.trim() !== "" &&
      formData.parentCountry.trim() !== "" &&
      formData.parentPassword === formData.parentConfirmPassword
    )
  }

  const isStudentInfoComplete = () => {
    return (
      formData.childFirstName.trim() !== "" &&
      formData.childLastName.trim() !== "" &&
      formData.childDOB.trim() !== "" &&
      formData.childEmail.trim() !== "" &&
      formData.childPassword.trim() !== "" &&
      formData.childConfirmPassword.trim() !== "" &&
      formData.childPassword === formData.childConfirmPassword
    )
  }

  const getAttendanceLimit = () => {
    if (!program) return "Loading..."

    const isOnceAWeek = program.name.toLowerCase().includes("once") || !program.name.toLowerCase().includes("twice")

    return isOnceAWeek ? "4 classes per month" : "8 classes per month"
  }

  const getFirstPaymentAmount = () => {
    if (!program || !formData.enrollmentDate) return 0

    const startDate = new Date(formData.enrollmentDate)
    const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
    const daysLeftInMonth = lastDayOfMonth.getDate() - startDate.getDate() + 1
    const totalDaysInMonth = lastDayOfMonth.getDate()

    const proportionRemaining = daysLeftInMonth / totalDaysInMonth

    return Number.parseFloat((program.price * proportionRemaining).toFixed(2))
  }

  const getNextPaymentDate = () => {
    if (!formData.enrollmentDate) return null

    const nextMonth = new Date(formData.enrollmentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)

    return nextMonth
  }

  const getAdminFee = () => {
    if (!program || !formData.enrollmentDate) return 0
    return Number.parseFloat((getFirstPaymentAmount() * 0.03).toFixed(2))
  }

  const getTaxAmount = () => {
    if (!program || !formData.enrollmentDate) return 0
    return Number.parseFloat((getFirstPaymentAmount() * 0.05).toFixed(2))
  }

  const getTotalAmountDue = () => {
    if (!program || !formData.enrollmentDate) return 0
    return Number.parseFloat((getFirstPaymentAmount() + getAdminFee() + getTaxAmount()).toFixed(2))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-primary">STEM Masters</h1>
            <p className="text-muted-foreground mt-1">Excellence in STEM Education</p>
          </div>
          <div className="mt-6">
            <h2 className="text-3xl font-bold">Enrollment</h2>
            <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
            <p className="text-lg mt-4">
              {isProgramLoading
                ? "Loading program details..."
                : program
                  ? `Enroll in ${program.offering.name}: ${program.name}`
                  : "Program not found"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {error && (
            <div className="mb-6">
              <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6">
              <div className="bg-green-500/15 text-green-600 dark:text-green-400 p-4 rounded-md">
                <p>{success}</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Enrollment Details</CardTitle>
              <CardDescription>Please provide all required information to complete your enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Tabs
                  defaultValue="details"
                  value={activeTab}
                  onValueChange={(value) => {
                    if (
                      value === "details" ||
                      (value === "parent" && isValidDate(formData.enrollmentDate)) ||
                      (value === "child" && isParentInfoComplete())
                    ) {
                      setActiveTab(value)
                      return
                    }

                    if (value === "parent" && (!formData.enrollmentDate || !isValidDate(formData.enrollmentDate))) {
                      toast({
                        title: "Invalid date",
                        description: "Please select a valid enrollment date",
                        variant: "destructive",
                      })
                      return
                    }

                    if (value === "child" && !isParentInfoComplete()) {
                      toast({
                        title: "Incomplete information",
                        description: "Please complete all required parent information",
                        variant: "destructive",
                      })
                      return
                    }

                    if (value === "payment" && !isStudentInfoComplete()) {
                      toast({
                        title: "Incomplete information",
                        description: "Please complete all required student information",
                        variant: "destructive",
                      })
                      return
                    }

                    setActiveTab(value)
                  }}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 mb-8">
                    <TabsTrigger value="details" className="flex items-center gap-2">
                      <InfoIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Enrollment Details</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="parent"
                      className="flex items-center gap-2"
                      disabled={!formData.enrollmentDate || !isValidDate(formData.enrollmentDate)}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Parent Info</span>
                    </TabsTrigger>
                    <TabsTrigger value="child" className="flex items-center gap-2" disabled={!isParentInfoComplete()}>
                      <GraduationCapIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Student Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment"
                      className="flex items-center gap-2"
                      disabled={!isStudentInfoComplete()}
                    >
                      <CreditCardIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Payment</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-6">
                    <EnrollmentDetails
                      program={program}
                      isProgramLoading={isProgramLoading}
                      formData={formData}
                      handleDateChange={handleDateChange}
                      getAttendanceLimit={getAttendanceLimit}
                      getFirstPaymentAmount={getFirstPaymentAmount}
                      getNextPaymentDate={getNextPaymentDate}
                      isValidDate={isValidDate}
                      setActiveTab={setActiveTab}
                    />
                  </TabsContent>

                  <TabsContent value="parent" className="space-y-6">
                    <ParentInfoForm formData={formData} handleChange={handleChange} setActiveTab={setActiveTab} />
                  </TabsContent>

                  <TabsContent value="child" className="space-y-6">
                    <StudentInfoForm formData={formData} handleChange={handleChange} setActiveTab={setActiveTab} />
                  </TabsContent>

                  <TabsContent value="payment" className="space-y-6">
                    <PaymentForm
                      program={program}
                      formData={formData}
                      discountCode={discountCode}
                      setDiscountCode={setDiscountCode}
                      handleChange={handleChange}
                      setFormData={setFormData}
                      getFirstPaymentAmount={getFirstPaymentAmount}
                      getAdminFee={getAdminFee}
                      getTaxAmount={getTaxAmount}
                      getTotalAmountDue={getTotalAmountDue}
                      setActiveTab={setActiveTab}
                      isLoading={isLoading}
                    />
                  </TabsContent>
                </Tabs>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default FinalizeEnrollment
