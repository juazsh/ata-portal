"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { PlusIcon, CalendarIcon, FilterIcon } from "lucide-react"
import { ClassSessionList } from "./class-session-list"
import { ClassSessionModal } from "./class-session.modal"
import { ClassSessionDetailsModal } from "./class-session-details-model"
import { ConfirmDeleteModal } from "./class-delete-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

function ClassSessionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // State for data
  const [sessions, setSessions] = useState([])
  const [programs, setPrograms] = useState([])

  // State for UI
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [programFilter, setProgramFilter] = useState("all")

  // State for modals
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [sessionToView, setSessionToView] = useState(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)

  const isAdmin = user?.role === "admin" || user?.role === "owner"

  // Fetch data functions
  const fetchSessions = async () => {
    try {
      setLoading(true)

      let url = "/api/class-sessions"
      if (programFilter && programFilter !== "all") {
        url += `?program_id=${programFilter}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`)
      }

      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error("Error fetching class sessions:", err)
      setError(err.message)
      toast({
        title: "Error",
        description: "Failed to load class sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/programs/public")

      if (!response.ok) {
        throw new Error(`Failed to fetch programs: ${response.status}`)
      }

      const data = await response.json()
      setPrograms(data)
    } catch (err) {
      console.error("Error fetching programs:", err)
      toast({
        title: "Error",
        description: "Failed to load programs data",
        variant: "destructive",
      })
    }
  }

  // Handler functions
  const handleAddSession = () => {
    setCurrentSession(null)
    setSessionModalOpen(true)
  }

  const handleEditSession = (session) => {
    setCurrentSession(session)
    setSessionModalOpen(true)
  }

  const handleDeleteSession = (session) => {
    setSessionToDelete(session)
    setConfirmDeleteOpen(true)
  }

  const handleViewDetails = (session) => {
    setSessionToView(session)
    setDetailsModalOpen(true)
  }

  const handleProgramFilterChange = (value) => {
    setProgramFilter(value || "all")
  }

  // Delete operation
  const deleteSession = async () => {
    if (!sessionToDelete) return

    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch(`/api/class-sessions/${sessionToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete class session")
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id))

      toast({
        title: "Success",
        description: "Class session deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting class session:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete class session",
        variant: "destructive",
      })
    } finally {
      setConfirmDeleteOpen(false)
      setSessionToDelete(null)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchSessions()
    fetchPrograms()
  }, [])

  // Fetch sessions when filter changes
  useEffect(() => {
    fetchSessions()
  }, [programFilter])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Class Sessions"
        description="Manage your class schedules and sessions"
        badge={isAdmin ? { text: user?.role?.toUpperCase(), variant: "outline" } : undefined}
      >
        {isAdmin && (
          <Button onClick={handleAddSession} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Session
          </Button>
        )}
      </PageHeader>

      <div className="flex items-end gap-4 mt-6 mb-8">
        <div className="w-full max-w-xs">
          <Label htmlFor="program-filter" className="mb-2 block text-sm">Filter by Program</Label>
          <Select
            value={programFilter}
            onValueChange={handleProgramFilterChange}
          >
            <SelectTrigger id="program-filter" className="w-full">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((program) => (
                <SelectItem key={program._id} value={program._id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <ClassSessionList
          sessions={sessions}
          loading={loading}
          error={error}
          isAdmin={isAdmin}
          onAddSession={handleAddSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
          onViewDetails={handleViewDetails}
          fetchSessions={fetchSessions}
          programs={programs}
        />
      </div>

      {/* Modals */}
      <ClassSessionDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        session={sessionToView}
        programs={programs}
      />

      <ClassSessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        currentSession={currentSession}
        programs={programs}
        onSuccess={(newOrUpdatedSession) => {
          if (currentSession) {
            setSessions((prev) =>
              prev.map((s) => (s.id === currentSession.id ? newOrUpdatedSession : s))
            )
          } else {
            setSessions((prev) => [...prev, newOrUpdatedSession])
          }
        }}
      />

      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete Class Session"
        description={
          sessionToDelete
            ? `Are you sure you want to delete the class session on ${sessionToDelete.weekday} at ${sessionToDelete.start_time}? This action cannot be undone.`
            : "Are you sure you want to delete this class session? This action cannot be undone."
        }
        onConfirm={deleteSession}
      />
    </div>
  )
}

export default ClassSessionsPage