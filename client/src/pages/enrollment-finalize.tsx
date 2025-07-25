"use client"

import type React from "react"
import { Link } from "wouter"
import { useState, useEffect } from "react"
import { useParams } from "wouter"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import logoImage from "@/assets/images/new_logo.png";
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
    stripePaymentMethodId: "",
    stripeCustomerId: "",
    enableAutoPay: false,
    discountPercent: 0,
    userAgreedToTerm: false,
    userAgreedToChargeTheCard: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isProgramLoading, setIsProgramLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [discountCode, setDiscountCode] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showExistingUserModal, setShowExistingUserModal] = useState(false)
  const [showAgreementModal, setShowAgreementModal] = useState(true)

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
  const handleExistingUserDetected = (email: string) => {
    setShowExistingUserModal(true)
  }
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

    try {
      if (!program || !formData.enrollmentDate) {
        setError("Program information or enrollment date is missing")
        setIsLoading(false)
        return
      }
      if (formData.paymentMethod === "credit-card" && !formData.stripePaymentMethodId) {
        setError("Please add a credit card before completing enrollment.");
        setIsLoading(false);
        return;
      }
      if (!formData.paymentMethod) {
        setError("Please select a payment method before completing enrollment.");
        setIsLoading(false);
        return;
      }
      const firstPaymentAmount = getFirstPaymentAmount()
      const adminFee = getAdminFee()
      const taxAmount = getTaxAmount()
      const totalAmountDue = getTotalAmountDue()

      const registrationData = {
        parentFirstName: formData.parentFirstName,
        parentLastName: formData.parentLastName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,

        studentFirstName: formData.childFirstName,
        studentLastName: formData.childLastName,
        studentDOB: formData.childDOB,

        programId: program._id,
        programName: `${program.offering.name}: ${program.name}`,
        offeringId: program.offering._id,
        enrollmentDate: formData.enrollmentDate.toISOString(),

        paymentMethod: formData.paymentMethod,
        firstPaymentAmount,
        adminFee,
        taxAmount,
        totalAmountDue,
        discountCode: discountCode || undefined,
        enableAutoPay: formData.enableAutoPay,
        discountPercent: formData.discountPercent,

        stripePaymentMethodId: formData.stripePaymentMethodId,
        stripeCustomerId: formData.stripeCustomerId,

        isRegistrationComplete: false,
        isRegLinkedWithEnrollment: false,
        isUserSetup: false,
        userAgreedToTerm: formData.userAgreedToTerm,
        userAgreedToChargeTheCard: formData.userAgreedToChargeTheCard,
      }

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })

      const data = await response.json()

      if (response.status === 409) {
        setShowExistingUserModal(true)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong")
      }

      setSuccess("Registration submitted successfully!")
      setShowSuccessModal(true)
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
      formData.parentPhone.trim() !== ""
    )
  }

  const isStudentInfoComplete = () => {
    return (
      formData.childFirstName.trim() !== "" &&
      formData.childLastName.trim() !== "" &&
      formData.childDOB.trim() !== ""
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
    if (formData.enableAutoPay) return 0
    return Number.parseFloat((getFirstPaymentAmount() * 0.03).toFixed(2))
  }

  const getTaxAmount = () => {
    if (!program || !formData.enrollmentDate) return 0
    return Number.parseFloat((getFirstPaymentAmount() * 0.05).toFixed(2))
  }

  const getTotalAmountDue = () => {
    if (!program || !formData.enrollmentDate) return 0
    const discount = formData.discountPercent ? getFirstPaymentAmount() * (formData.discountPercent / 100) : 0
    return Number.parseFloat((getFirstPaymentAmount() - discount + getAdminFee() + getTaxAmount()).toFixed(2))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      {/* Agreement Modal */}
      <Dialog open={showAgreementModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Registration Agreement</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="text-base mb-4">
                Please review and agree to the terms before continuing with registration. By clicking "Agree and Continue", you acknowledge you have read and accept our policies regarding enrollment, payment, and refunds.
              </p>
              <ul className="text-left text-sm mb-4 list-disc pl-6">
                <li>All enrollments are subject to program availability and approval.</li>
                <li>Payments are processed securely. Refunds are subject to our refund policy.</li>
                <li>Auto-pay enrollment will waive admin fees (see payment step).</li>
                <li>Contact support for any questions before proceeding.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => {
                setShowAgreementModal(false)
                setFormData((prev) => ({ ...prev, userAgreedToTerm: true }))
              }}
              className="w-full sm:w-auto"
            >
              Agree and Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <img
            src={logoImage}
            alt="STEM Masters Logo"
            width={240}
            height={120}
            className="object-contain h-20"
          />
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
                      (value === "child" && isParentInfoComplete()) ||
                      (value === "payment" && isStudentInfoComplete())
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
                    <TabsTrigger
                      value="details"
                      className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white"
                    >
                      <InfoIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Enrollment Details</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="parent"
                      className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white"
                      disabled={!formData.enrollmentDate || !isValidDate(formData.enrollmentDate)}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Parent Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="child"
                      className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white"
                      disabled={!isParentInfoComplete()}
                    >
                      <GraduationCapIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Student Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment"
                      className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-white"
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
                    <ParentInfoForm 
                      formData={formData} 
                      handleChange={handleChange} 
                      setActiveTab={setActiveTab}
                      onExistingUserDetected={handleExistingUserDetected}
                      setFormData={setFormData}
                    />
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


      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-center text-2xl">Registration Successful!</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="text-base">
                Thank you for registering! An email regarding the enrollment has been sent to{" "}
                <span className="font-medium">{formData.parentEmail}</span>.
              </p>
              <p className="mt-4 text-base">
                Please check your email for further instructions to complete the enrollment process.
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
              Go to Homepage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showExistingUserModal} onOpenChange={setShowExistingUserModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Account Already Exists</DialogTitle>
            <DialogDescription className="text-center pt-4">
              <p className="text-base">
                A user with the email <span className="font-medium">{formData.parentEmail}</span> already exists in our system.
              </p>
              <p className="mt-4 text-base">
                Please log in to your existing account to add a new student or create a new enrollment.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 justify-center mt-6">
            <Button asChild className="w-full">
              <Link href="/auth">
                Log In
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExistingUserModal(false)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FinalizeEnrollment