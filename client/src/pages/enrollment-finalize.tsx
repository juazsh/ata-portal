"use client"

import { useState, useEffect } from "react"
import { useParams } from "wouter"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  UserIcon,
  GraduationCapIcon,
  CreditCardIcon,
  InfoIcon,
  CalendarIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Program {
  _id: string
  name: string
  description: string
  price: number
  googleClassroomLink?: string
  estimatedDuration: number
  offering: {
    _id: string
    name: string
    description: string
  }
  modules: Array<{
    _id: string
    name: string
    description: string
    estimatedDuration: number
  }>
}

interface FormData {
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPassword: string
  parentConfirmPassword: string
  parentPhone: string
  parentAddress: string
  parentCity: string
  parentZip: string
  parentState: string
  parentCountry: string
  childFirstName: string
  childLastName: string
  childDOB: string
  childEmail: string
  childPassword: string
  childConfirmPassword: string
  childPhone: string
  childAddress: string
  childCity: string
  childZip: string
  childState: string
  childCountry: string
  paymentMethod: string
  cardNumber?: string
  cardExpiry?: string
  cardCVC?: string
  enrollmentDate: Date | undefined
}

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
    enrollmentDate: undefined
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isProgramLoading, setIsProgramLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    const fetchProgramDetails = async () => {
      if (!params.pid) return

      try {
        setIsProgramLoading(true)
        console.log(params.pid)
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
  }, [params.programId, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, enrollmentDate: date })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Basic validation
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
        setError("Program information or enrollment date is missing");
        setIsLoading(false);
        return;
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
            price: program.price
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
      // Redirect to login after successful registration
      setTimeout(() => {
        window.location.href = "/signin"
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate next payment date (one month from enrollment date)
  const getNextPaymentDate = () => {
    if (!formData.enrollmentDate) return null

    const nextPaymentDate = new Date(formData.enrollmentDate)
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
    return nextPaymentDate
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
              {isProgramLoading ? (
                "Loading program details..."
              ) : program ? (
                `Enroll in ${program.offering.name}: ${program.name}`
              ) : (
                "Program not found"
              )}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {/* Alerts */}
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
              {/* <CardTitle>Enrollment Details</CardTitle> */}
              <CardDescription>
                Please provide all required information to complete your enrollment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Tabs
                  defaultValue="details"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 mb-8">
                    <TabsTrigger value="details" className="flex items-center gap-2">
                      <InfoIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Enrollment Details</span>
                    </TabsTrigger>
                    <TabsTrigger value="parent" className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Parent Info</span>
                    </TabsTrigger>
                    <TabsTrigger value="child" className="flex items-center gap-2">
                      <GraduationCapIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Student Info</span>
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="flex items-center gap-2">
                      <CreditCardIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Payment</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Enrollment Details Tab */}
                  <TabsContent value="details" className="space-y-6">
                    {isProgramLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <p>Loading program details...</p>
                      </div>
                    ) : program ? (
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Program Details</h2>
                        <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Program:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">{program.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Membership:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">{program.offering.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Start Date:</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-[240px] justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.enrollmentDate ? (
                                    format(formData.enrollmentDate, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={formData.enrollmentDate}
                                  onSelect={handleDateChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Attendance Limit:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">20 students</span>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Membership Payment Details</h2>
                        <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Sign-up Cost:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">${program.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Membership Monthly Fees:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">$49.99</span>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Payment Schedule</h2>
                        <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">1st Payment due today:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">${program.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Next Payment due on:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">
                              {formData.enrollmentDate ? format(getNextPaymentDate() || new Date(), 'PPP') : "Select start date"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Payment Schedule:</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">Monthly</span>
                          </div>
                        </div>

                        <div className="flex justify-end mt-6">
                          <Button
                            type="button"
                            onClick={() => setActiveTab("parent")}
                          >
                            Continue to Parent Info
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-600 dark:text-slate-400">
                          Program not found. Please go back and select a valid program.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Parent Tab */}
                  <TabsContent value="parent" className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Parent Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentFirstName">First Name</Label>
                          <Input
                            id="parentFirstName"
                            name="parentFirstName"
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentLastName">Last Name</Label>
                          <Input
                            id="parentLastName"
                            name="parentLastName"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor="parentEmail">Email Address</Label>
                        <Input
                          id="parentEmail"
                          name="parentEmail"
                          type="email"
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentPassword">Password</Label>
                          <Input
                            id="parentPassword"
                            name="parentPassword"
                            type="password"
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentConfirmPassword">Confirm Password</Label>
                          <Input
                            id="parentConfirmPassword"
                            name="parentConfirmPassword"
                            type="password"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor="parentPhone">Phone Number</Label>
                        <Input
                          id="parentPhone"
                          name="parentPhone"
                          onChange={handleChange}
                        />
                      </div>

                      <Separator className="my-6" />
                      <h3 className="text-md font-medium text-slate-900 dark:text-slate-50 mb-4">Address Information</h3>

                      <div className="space-y-2">
                        <Label htmlFor="parentAddress">Street Address</Label>
                        <Input
                          id="parentAddress"
                          name="parentAddress"
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentCity">City</Label>
                          <Input
                            id="parentCity"
                            name="parentCity"
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentZip">Zip Code</Label>
                          <Input
                            id="parentZip"
                            name="parentZip"
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="parentState">State</Label>
                          <Input
                            id="parentState"
                            name="parentState"
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentCountry">Country</Label>
                          <Input
                            id="parentCountry"
                            name="parentCountry"
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("details")}
                      >
                        Back to Enrollment Details
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("child")}
                      >
                        Continue to Student Info
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Child Tab */}
                  <TabsContent value="child" className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Student Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="childFirstName">First Name</Label>
                          <Input
                            id="childFirstName"
                            name="childFirstName"
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="childLastName">Last Name</Label>
                          <Input
                            id="childLastName"
                            name="childLastName"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor="childDOB">Date of Birth</Label>
                        <Input
                          id="childDOB"
                          name="childDOB"
                          type="date"
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor="childEmail">Email Address</Label>
                        <Input
                          id="childEmail"
                          name="childEmail"
                          type="email"
                          onChange={handleChange}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="childPassword">Password</Label>
                          <Input
                            id="childPassword"
                            name="childPassword"
                            type="password"
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="childConfirmPassword">Confirm Password</Label>
                          <Input
                            id="childConfirmPassword"
                            name="childConfirmPassword"
                            type="password"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor="childPhone">Phone Number</Label>
                        <Input
                          id="childPhone"
                          name="childPhone"
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("parent")}
                      >
                        Back to Parent Info
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("payment")}
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Payment Tab */}
                  <TabsContent value="payment" className="space-y-6">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Course Details</h2>
                      <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="text-slate-600 dark:text-slate-400">Course Name:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">React Native Development</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="text-slate-600 dark:text-slate-400">Course Fee:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">$200.00</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="text-slate-600 dark:text-slate-400">Admin Fee:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">$30.00</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="text-slate-600 dark:text-slate-400">Tax Amount:</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">$20.00</span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-slate-900 dark:text-slate-50 font-semibold">Total Amount Due:</span>
                          <span className="text-slate-900 dark:text-slate-50 font-semibold">$250.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Payment Method</h2>

                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={formData.paymentMethod === "paypal" ? "default" : "outline"}
                          className="flex items-center justify-center gap-2 py-6"
                          onClick={() => setFormData({ ...formData, paymentMethod: "paypal" })}
                        >
                          <PaypalIcon className="h-5 w-5" />
                          <span>PayPal</span>
                        </Button>

                        <Button
                          type="button"
                          variant={formData.paymentMethod === "credit-card" ? "default" : "outline"}
                          className="flex items-center justify-center gap-2 py-6"
                          onClick={() => setFormData({ ...formData, paymentMethod: "credit-card" })}
                        >
                          <CreditCardIcon className="h-5 w-5" />
                          <span>Credit Card</span>
                        </Button>
                      </div>

                      {formData.paymentMethod === "credit-card" && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                              id="cardNumber"
                              name="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="cardExpiry">Expiry Date</Label>
                              <Input
                                id="cardExpiry"
                                name="cardExpiry"
                                placeholder="MM/YY"
                                onChange={handleChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cardCVC">CVC</Label>
                              <Input
                                id="cardCVC"
                                name="cardCVC"
                                placeholder="123"
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("child")}
                      >
                        Back to Student Info
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !formData.enrollmentDate}
                        className="min-w-[150px]"
                      >
                        {isLoading ? "Processing..." : "Complete Enrollment"}
                      </Button>
                    </div>

                    {formData.paymentMethod === "paypal" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 mt-4"
                        disabled={isLoading}
                      >
                        <PaypalIcon className="h-5 w-5" />
                        Pay with PayPal
                      </Button>
                    )}
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

/* Mock PayPal Icon since it wasn't imported in the dashboard file */
function PaypalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 11l5-5l5 5l-5 5z" />
      <path d="M4 7v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7m-16 0a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1m-16 0v2h16V7" />
    </svg>
  );
}