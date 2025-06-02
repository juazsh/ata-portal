"use client"

import { useEffect, useState } from "react"
import { useParams } from "wouter"
import {
  LoaderIcon,
  GraduationCap,
  Calendar,
  CreditCard,
  Clock,
  BookOpen,
  BarChart3,
  AlertCircle,
  FileText,
  Layers,
  ListChecks,
  DollarSign,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface Topic {
  _id: string
  name: string
  description: string
  estimatedDuration: number
  taughtBy?: string
}

interface Module {
  _id: string
  name: string
  description: string
  estimatedDuration: number
  topics: Topic[]
}

interface Program {
  _id: string
  name: string
  description: string
  price: number
  estimatedDuration: number
  image?: string
  offering: {
    _id: string
    name: string
    description: string
    description2?: string
  }
  modules: Module[]
}

interface Enrollment {
  _id: string
  programId: Program
  offeringType: "Marathon" | "Sprint"
  classSessions: string[]
  autoPayEnabled?: boolean
  nextPaymentDueDate?: string
  monthlyDueAmount?: number
  lastAmountPaid: number
  lastPaymentDate?: string
  lastPaymentTransactionId?: string
  lastPaymentMethod: string
  lastPaymentStatus: string
  createdAt: string
  paymentHistory?: {
    amount: number
    date: string
    status: string
    processor: string
    transactionId: string
  }[]
}

export default function StudentEnrollmentDetails() {
  const { username, enrollmentId } = useParams<{ username: string; enrollmentId: string }>()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState("enrollment")

  useEffect(() => {
    async function fetchEnrollment() {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem("auth_token")
        const res = await fetch(`/api/enrollments/${enrollmentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch enrollment")
        const data = await res.json()
        setEnrollment(data.enrollment)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    if (enrollmentId) fetchEnrollment()
  }, [enrollmentId])

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LoaderIcon className="animate-spin h-12 w-12 text-primary" />
        <p className="text-muted-foreground">Loading enrollment details...</p>
      </div>
    )

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error Loading Enrollment</h3>
          <p>{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )

  if (!enrollment)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground">
        <FileText className="h-12 w-12" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">No Enrollment Found</h3>
          <p>The requested enrollment details could not be found.</p>
        </div>
      </div>
    )

  const program = enrollment.programId

  const enrollmentDate = new Date(enrollment.createdAt)
  const today = new Date()
  const daysSinceEnrollment = Math.floor((today.getTime() - enrollmentDate.getTime()) / (1000 * 3600 * 24))

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "completed":
      case "success":
        return <Badge className="bg-green-500">Paid</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            Pending
          </Badge>
        )
      case "failed":
      case "declined":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Enrollment Details</h1>
          <p className="text-muted-foreground">
            Viewing details for enrollment created on {enrollmentDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={enrollment.offeringType === "Marathon" ? "default" : "secondary"}
            className="text-sm px-3 py-1 rounded-full"
          >
            {enrollment.offeringType} Program
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1 rounded-full">
            ID: {enrollment._id.substring(0, 8)}
          </Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-8 h-12 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger
            value="enrollment"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span>Enrollment Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="program"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <BookOpen className="h-4 w-4" />
            <span>Program Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Student Progress</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden border flex-shrink-0 bg-muted/30 flex items-center justify-center">
                    {program.image ? (
                      <img
                        src={program.image || "/placeholder.svg"}
                        alt={program.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{program.name}</CardTitle>
                    <CardDescription className="text-base mt-1">{program.offering?.name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Enrollment Information</h3>
                    </div>

                    <div className="space-y-3 pl-7">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Enrollment Date:</span>
                        <span className="font-medium">{enrollmentDate.toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Days Enrolled:</span>
                        <span className="font-medium">{daysSinceEnrollment} days</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Program Type:</span>
                        <span className="font-medium">{enrollment.offeringType}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Offering:</span>
                        <span className="font-medium">{program.offering?.name}</span>
                      </div>
                    </div>

                    {enrollment.offeringType === "Marathon" && (
                      <>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">Payment Schedule</h3>
                        </div>

                        <div className="space-y-3 pl-7">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">AutoPay Enabled:</span>
                            <Switch checked={!!enrollment.autoPayEnabled} disabled />
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <span className="text-muted-foreground">Monthly Amount:</span>
                            <span className="font-medium">${enrollment.monthlyDueAmount}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <span className="text-muted-foreground">Next Payment:</span>
                            <span className="font-medium">
                              {enrollment.nextPaymentDueDate
                                ? new Date(enrollment.nextPaymentDueDate).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Payment Information</h3>
                    </div>

                    <div className="space-y-3 pl-7">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Last Amount:</span>
                        <span className="font-medium">${enrollment.lastAmountPaid}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Last Payment Date:</span>
                        <span className="font-medium">
                          {enrollment.lastPaymentDate
                            ? new Date(enrollment.lastPaymentDate).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium">{enrollment.lastPaymentMethod || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Status:</span>
                        <span>{getPaymentStatusBadge(enrollment.lastPaymentStatus)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-medium text-xs truncate">
                          {enrollment.lastPaymentTransactionId || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Class Sessions</h3>
                  </div>

                  {enrollment.classSessions && enrollment.classSessions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-7">
                      {enrollment.classSessions.map((session, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted/30 rounded-lg border border-border flex items-center gap-2"
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{session}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-7 text-muted-foreground italic">No sessions assigned</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Payment History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {enrollment.paymentHistory && enrollment.paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {enrollment.paymentHistory.map((payment, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">${payment.amount}</div>
                          {payment.status.toLowerCase() === "paid" ||
                          payment.status.toLowerCase() === "completed" ||
                          payment.status.toLowerCase() === "success" ? (
                            <Badge className="bg-green-500">Paid</Badge>
                          ) : payment.status.toLowerCase() === "pending" ? (
                            <Badge variant="outline" className="text-amber-500 border-amber-500">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm mt-1 flex items-center gap-1">
                          <span className="text-muted-foreground">Processor:</span>
                          <span>{payment.processor}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">ID: {payment.transactionId}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <CreditCard className="h-10 w-10 mb-2 opacity-20" />
                    <p>No payment history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="program" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden border flex-shrink-0 bg-muted/30 flex items-center justify-center">
                  {program.image ? (
                    <img
                      src={program.image || "/placeholder.svg"}
                      alt={program.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl">{program.name}</CardTitle>
                  <CardDescription className="text-base mt-1">{program.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Offering</h3>
                  <p>{program.offering?.name}</p>
                </div>

                <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Duration</h3>
                  <p>{program.estimatedDuration} hours</p>
                </div>

                <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Price</h3>
                  <p>${program.price}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-xl">Modules & Topics</h3>
                </div>

                {program.modules && program.modules.length > 0 ? (
                  <div className="space-y-6">
                    {program.modules.map((mod, index) => (
                      <Card key={mod._id} className="overflow-hidden border">
                        <CardHeader className="bg-muted/30 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium">
                                {index + 1}
                              </div>
                              <CardTitle className="text-lg">{mod.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {mod.estimatedDuration} hrs
                            </Badge>
                          </div>
                          {mod.description && <CardDescription className="mt-2">{mod.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <ListChecks className="h-4 w-4" />
                              <span>Topics</span>
                            </div>

                            {mod.topics && mod.topics.length > 0 ? (
                              <div className="space-y-2 pl-6">
                                {mod.topics.map((topic) => (
                                  <div
                                    key={topic._id}
                                    className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                                      <span>{topic.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {topic.estimatedDuration} min
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-muted-foreground italic pl-6">No topics available</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Layers className="h-12 w-12 mb-3 opacity-20" />
                    <h4 className="text-lg font-medium text-foreground">No Modules Available</h4>
                    <p>This program doesn't have any modules defined yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Student Progress</CardTitle>
              </div>
              <CardDescription>Track student progress through the program curriculum.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Modules Completed</h3>
                  <div className="text-3xl font-bold text-primary">0/{program.modules?.length || 0}</div>
                </div>

                <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <ListChecks className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Topics Completed</h3>
                  <div className="text-3xl font-bold text-primary">0/--</div>
                </div>

                <div className="p-6 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-full mb-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Hours Spent</h3>
                  <div className="text-3xl font-bold text-primary">0</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Overall Progress</h3>
                  <Badge variant="outline">0%</Badge>
                </div>
                <Progress value={0} className="h-2" />
              </div>

              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="p-6 bg-muted/30 rounded-full mb-4">
                  <BarChart3 className="h-12 w-12 opacity-40" />
                </div>
                <h4 className="text-lg font-medium text-foreground">Progress Tracking Coming Soon</h4>
                <p className="max-w-md mx-auto mt-2">
                  Detailed progress charts and analytics will be available in a future update.
                </p>
                <Button variant="outline" className="mt-6">
                  Check Back Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
