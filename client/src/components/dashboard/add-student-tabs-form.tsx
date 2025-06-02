"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  CalendarIcon,
  CheckCircle,
  User,
  GraduationCap,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function AddStudentTabsForm({
  isOpen,
  onClose,
  onSuccess,
  parentId,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (enrollment: any) => void
  parentId?: string
}) {
  const [programs, setPrograms] = useState<any[]>([])
  const [addStudentData, setAddStudentData] = useState({
    programId: "",
    studentFirstName: "",
    studentLastName: "",
    studentDOB: "",
    classSessionId: "",
  })
  const [availableSessions, setAvailableSessions] = useState<any[]>([])
  const [sessionLoading, setSessionLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [addError, setAddError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("program")
  const [completedTabs, setCompletedTabs] = useState(["program"])

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    if (addStudentData.programId) {
      setSessionLoading(true)
      fetch(`/api/class-sessions?program_id=${addStudentData.programId}`)
        .then((res) => res.json())
        .then((data) => setAvailableSessions(data.sessions || []))
        .catch(() => setAvailableSessions([]))
        .finally(() => setSessionLoading(false))
    } else {
      setAvailableSessions([])
    }
  }, [addStudentData.programId])

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/programs", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch programs")
      const data = await response.json()
      setPrograms(data)
    } catch (e) {
      setPrograms([])
    }
  }

  const handleAddStudentChange = (e: any) => {
    const { name, value } = e.target
    setAddStudentData((prev) => ({ ...prev, [name]: value }))
  }

  const isProgramStepValid = !!addStudentData.programId
  const isStudentStepValid =
    !!addStudentData.studentFirstName && !!addStudentData.studentLastName && !!addStudentData.studentDOB
  const isSessionStepValid = !!selectedSessionId

  const handleSelectProgram = (programId: any) => {
    setAddStudentData((prev) => ({ ...prev, programId }))
    setAddError("")
    setCompletedTabs(["program"])
  }

  const handleTabNext = () => {
    setAddError("")
    if (activeTab === "program" && !isProgramStepValid) {
      setAddError("Please select a program.")
      return
    }
    if (activeTab === "student" && !isStudentStepValid) {
      setAddError("Please fill all student information fields.")
      return
    }
    if (activeTab === "session" && !isSessionStepValid) {
      setAddError("Please select a class session.")
      return
    }
    if (activeTab === "program") {
      setActiveTab("student")
      setCompletedTabs(["program", "student"])
    } else if (activeTab === "student") {
      setActiveTab("session")
      setCompletedTabs(["program", "student", "session"])
    } else if (activeTab === "session") {
      setActiveTab("confirm")
      setCompletedTabs(["program", "student", "session", "confirm"])
    }
  }

  const handleTabBack = () => {
    setAddError("")
    if (activeTab === "student") setActiveTab("program")
    else if (activeTab === "session") setActiveTab("student")
    else if (activeTab === "confirm") setActiveTab("session")
  }

  const handleTabChange = (tab: any) => {
    if (completedTabs.includes(tab)) {
      setActiveTab(tab)
    }
  }

  const handleAddStudentSubmit = async () => {
    setIsSubmitting(true)
    setAddError("")
    try {
      const token = localStorage.getItem("auth_token")
      const enrollmentRes = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          programId: addStudentData.programId,
          student: {
            firstName: addStudentData.studentFirstName,
            lastName: addStudentData.studentLastName,
            dob: addStudentData.studentDOB,
            parentId: parentId || undefined,
          },
          classSessionId: selectedSessionId,
        }),
      })
      if (!enrollmentRes.ok) {
        const err = await enrollmentRes.json()
        throw new Error((err as any).message || "Failed to create enrollment")
      }
      const enrollment = await enrollmentRes.json()
      if (onSuccess) onSuccess(enrollment)
      if (onClose) onClose()
      setActiveTab("program")
      setAddStudentData({
        programId: "",
        studentFirstName: "",
        studentLastName: "",
        studentDOB: "",
        classSessionId: "",
      })
      setSelectedSessionId("")
    } catch (err: any) {
      setAddError(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepProgress = () => {
    const steps = ["program", "student", "session", "confirm"]
    const currentIndex = steps.indexOf(activeTab)
    return ((currentIndex + 1) / steps.length) * 100
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Add New Student</DialogTitle>
              <p className="text-muted-foreground mt-1">Complete the enrollment process in 4 simple steps</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {["program", "student", "session", "confirm"].indexOf(activeTab) + 1} of 4</span>
              <span>{Math.round(getStepProgress())}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </DialogHeader>

        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-4 mb-8 h-12 bg-muted/50">
            <TabsTrigger
              value="program"
              disabled={false}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Program</span>
            </TabsTrigger>
            <TabsTrigger
              value="student"
              disabled={!completedTabs.includes("student")}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Student</span>
            </TabsTrigger>
            <TabsTrigger
              value="session"
              disabled={!completedTabs.includes("session")}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Session</span>
            </TabsTrigger>
            <TabsTrigger
              value="confirm"
              disabled={!completedTabs.includes("confirm")}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Confirm</span>
            </TabsTrigger>
          </TabsList>

          <div className="min-h-[400px]">
            <TabsContent value="program" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Select a Program</h3>
                </div>
                <p className="text-muted-foreground">Choose the program you'd like to enroll your student in.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {programs.map((program) => (
                  <Card
                    key={program.id || program._id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      addStudentData.programId === (program.id || program._id)
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleSelectProgram(program.id || program._id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        {addStudentData.programId === (program.id || program._id) && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground text-sm leading-relaxed">{program.description}</p>
                      {program.duration && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{program.duration}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {addError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{addError}</p>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <Button onClick={handleTabNext} disabled={!isProgramStepValid} className="px-8">
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="student" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Student Information</h3>
                </div>
                <p className="text-muted-foreground">Please provide the student's basic information.</p>
              </div>

              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="studentFirstName" className="text-sm font-medium">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="studentFirstName"
                      name="studentFirstName"
                      placeholder="Enter first name"
                      value={addStudentData.studentFirstName}
                      onChange={handleAddStudentChange}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentLastName" className="text-sm font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="studentLastName"
                      name="studentLastName"
                      placeholder="Enter last name"
                      value={addStudentData.studentLastName}
                      onChange={handleAddStudentChange}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="studentDOB" className="text-sm font-medium">
                      Date of Birth <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="studentDOB"
                        name="studentDOB"
                        type="date"
                        value={addStudentData.studentDOB}
                        onChange={handleAddStudentChange}
                        className="h-11"
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </Card>

              {addError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{addError}</p>
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleTabBack} className="px-8">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleTabNext} disabled={!isStudentStepValid} className="px-8">
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="session" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Choose Class Session</h3>
                </div>
                <p className="text-muted-foreground">Select a class session that works best for your schedule.</p>
              </div>

              <Card className="p-6">
                {sessionLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading available sessions...</p>
                  </div>
                ) : availableSessions.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">No Sessions Available</h4>
                      <p className="text-muted-foreground">
                        No class sessions are currently available for this program.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableSessions.map((session) => {
                      const isSelected = selectedSessionId === (session.id || session._id)
                      const isFull = session.available_capacity <= 0
                      const capacityPercentage =
                        session.total_capacity === 0
                          ? 0
                          : Math.round(
                              ((session.total_capacity - session.available_capacity) / session.total_capacity) * 100,
                            )

                      return (
                        <div
                          key={session.id || session._id}
                          className={`p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            isFull
                              ? "bg-muted/30 border-muted opacity-60 cursor-not-allowed"
                              : isSelected
                                ? "bg-primary/5 border-primary shadow-md"
                                : "bg-background border-border hover:border-primary/50 hover:shadow-sm"
                          }`}
                          onClick={() => !isFull && setSelectedSessionId(session.id || session._id)}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold text-lg">{session.weekday}</h4>
                                {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                              </div>

                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {session.start_time} - {session.end_time}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={session.type === "weekday" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {session.type === "weekday" ? "Weekday" : "Weekend"}
                                </Badge>
                                {isFull && (
                                  <Badge variant="destructive" className="text-xs">
                                    Full
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3 lg:w-48">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Capacity</span>
                                </div>
                                <span className="font-medium">
                                  {session.available_capacity} of {session.total_capacity} available
                                </span>
                              </div>
                              <Progress value={capacityPercentage} className="h-2" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              {addError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{addError}</p>
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleTabBack} className="px-8">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleTabNext} disabled={!isSessionStepValid} className="px-8">
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="confirm" className="space-y-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Review & Confirm</h3>
                </div>
                <p className="text-muted-foreground">Please review the enrollment details before submitting.</p>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Program</Label>
                        <p className="text-lg font-semibold mt-1">
                          {programs.find((p) => (p.id || p._id) === addStudentData.programId)?.name}
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Student Name</Label>
                        <p className="text-lg font-semibold mt-1">
                          {addStudentData.studentFirstName} {addStudentData.studentLastName}
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                        <p className="text-lg font-semibold mt-1">
                          {new Date(addStudentData.studentDOB).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Class Schedule</Label>
                        <div className="mt-1">
                          <p className="text-lg font-semibold">
                            {availableSessions.find((cs) => (cs.id || cs._id) === selectedSessionId)?.weekday}
                          </p>
                          <p className="text-muted-foreground">
                            {availableSessions.find((cs) => (cs.id || cs._id) === selectedSessionId)?.start_time} -{" "}
                            {availableSessions.find((cs) => (cs.id || cs._id) === selectedSessionId)?.end_time}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment</Label>
                        <p className="text-lg font-semibold mt-1">Parent Profile</p>
                        <p className="text-sm text-muted-foreground">
                          Payment will be processed using parent profile information
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      By submitting this enrollment, you agree to the program terms and conditions. You will receive a
                      confirmation email once the enrollment is processed.
                    </p>
                  </div>
                </div>
              </Card>

              {addError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{addError}</p>
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleTabBack} className="px-8">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleAddStudentSubmit}
                  disabled={isSubmitting}
                  className="px-8 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Enrollment
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
