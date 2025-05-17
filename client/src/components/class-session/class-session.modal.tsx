"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2Icon, ClockIcon } from "lucide-react"

export function ClassSessionModal({ open, onOpenChange, currentSession, programs, onSuccess }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    program_id: "none",
    weekday: "",
    start_time: "",
    end_time: "",
    type: "",
    total_capacity: 0,          // Changed from regular_capacity to total_capacity
    available_capacity: 0,      // Added available_capacity
    total_demo_capacity: 0,     // Changed from capacity_demo to total_demo_capacity
    available_demo_capacity: 0, // Added available_demo_capacity
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentSession) {
      setFormData({
        program_id: currentSession.program_id && typeof currentSession.program_id === 'object'
          ? currentSession.program_id._id
          : currentSession.program_id || "none",
        weekday: currentSession.weekday,
        start_time: currentSession.start_time,
        end_time: currentSession.end_time,
        type: currentSession.type,
        // Handle both old and new field names for backward compatibility during transition
        total_capacity: currentSession.total_capacity || currentSession.regular_capacity || 0,
        available_capacity: currentSession.available_capacity || currentSession.total_capacity || currentSession.regular_capacity || 0,
        total_demo_capacity: currentSession.total_demo_capacity || currentSession.capacity_demo || 0,
        available_demo_capacity: currentSession.available_demo_capacity || currentSession.total_demo_capacity || currentSession.capacity_demo || 0,
      })
    } else {
      resetForm()
    }
  }, [currentSession, open])

  const resetForm = () => {
    setFormData({
      program_id: "none",
      weekday: "",
      start_time: "",
      end_time: "",
      type: "",
      total_capacity: 0,
      available_capacity: 0,
      total_demo_capacity: 0,
      available_demo_capacity: 0,
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const numValue = name.includes("capacity") ? Number.parseInt(value) : value

    setFormData((prev) => {
      const newState = {
        ...prev,
        [name]: numValue,
      }

      // Auto-update available capacity when total capacity changes
      if (name === "total_capacity") {
        // If editing an existing session, preserve difference between total and available
        const diff = currentSession
          ? Math.max(0, (currentSession.total_capacity || currentSession.regular_capacity) -
            (currentSession.available_capacity || currentSession.total_capacity || currentSession.regular_capacity))
          : 0
        newState.available_capacity = Math.max(0, Number(value) - diff)
      }

      // Auto-update available demo capacity when total demo capacity changes
      if (name === "total_demo_capacity") {
        // If editing an existing session, preserve difference between total and available
        const diff = currentSession
          ? Math.max(0, (currentSession.total_demo_capacity || currentSession.capacity_demo) -
            (currentSession.available_demo_capacity || currentSession.total_demo_capacity || currentSession.capacity_demo))
          : 0
        newState.available_demo_capacity = Math.max(0, Number(value) - diff)
      }

      return newState
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      // Prepare data for submission - convert special values
      const submissionData = {
        ...formData,
        program_id: formData.program_id === "none" ? "" : formData.program_id,
        weekday: formData.weekday === "select-weekday" ? "" : formData.weekday,
        type: formData.type === "select-type" ? "" : formData.type,
        // For new sessions, available capacity equals total capacity initially
        available_capacity: currentSession ? formData.available_capacity : formData.total_capacity,
        available_demo_capacity: currentSession ? formData.available_demo_capacity : formData.total_demo_capacity
      };

      const url = currentSession ? `/api/class-sessions/${currentSession.id}` : "/api/class-sessions"

      const method = currentSession ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${currentSession ? "update" : "create"} class session`)
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Class session ${currentSession ? "updated" : "created"} successfully`,
      })

      onSuccess(result)
      onOpenChange(false)
      resetForm()
    } catch (err) {
      console.error(`Error ${currentSession ? "updating" : "creating"} class session:`, err)
      toast({
        title: "Error",
        description: err.message || `Failed to ${currentSession ? "update" : "create"} class session`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{currentSession ? "Edit Class Session" : "Add New Class Session"}</DialogTitle>
          <DialogDescription>
            {currentSession
              ? "Update the details of the existing class session."
              : "Fill out the form below to create a new class session."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="program_id">Program (Optional)</Label>
            <Select
              name="program_id"
              value={formData.program_id || "none"}
              onValueChange={(value) => handleSelectChange("program_id", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Program</SelectItem>
                {programs && programs.map((program) => (
                  <SelectItem key={program._id} value={program._id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="weekday">Weekday*</Label>
            <Select
              name="weekday"
              value={formData.weekday || "select-weekday"}
              onValueChange={(value) => handleSelectChange("weekday", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a weekday" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select-weekday" disabled>Select a weekday</SelectItem>
                {weekdays.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="start_time">Start Time*</Label>
              <Input
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                required
                placeholder="HH:MM (24-hour)"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                title="Time in HH:MM format (24-hour)"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="end_time">End Time*</Label>
              <Input
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                required
                placeholder="HH:MM (24-hour)"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                title="Time in HH:MM format (24-hour)"
              />
            </div>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="type">Session Type*</Label>
            <Select
              name="type"
              value={formData.type || "select-type"}
              onValueChange={(value) => handleSelectChange("type", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select-type" disabled>Select session type</SelectItem>
                <SelectItem value="weekday">Weekday</SelectItem>
                <SelectItem value="weekend">Weekend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="total_capacity">Total Capacity*</Label>
              <Input
                id="total_capacity"
                name="total_capacity"
                type="number"
                value={formData.total_capacity}
                onChange={handleInputChange}
                required
                min="0"
              />
              <p className="text-xs text-slate-500">
                Available: {formData.available_capacity} {currentSession && "(Set automatically for new sessions)"}
              </p>
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="total_demo_capacity">Demo Capacity*</Label>
              <Input
                id="total_demo_capacity"
                name="total_demo_capacity"
                type="number"
                value={formData.total_demo_capacity}
                onChange={handleInputChange}
                required
                min="0"
              />
              <p className="text-xs text-slate-500">
                Available: {formData.available_demo_capacity} {currentSession && "(Set automatically for new sessions)"}
              </p>
            </div>
          </div>

          {currentSession && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> When editing a session, the available capacity fields will be adjusted automatically based on your changes to total capacity.
              </p>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.weekday ||
                formData.weekday === "select-weekday" ||
                !formData.start_time ||
                !formData.end_time ||
                !formData.type ||
                formData.type === "select-type" ||
                formData.total_capacity < 0 ||
                formData.total_demo_capacity < 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {currentSession ? "Updating..." : "Creating..."}
                </>
              ) : currentSession ? (
                "Update Session"
              ) : (
                "Create Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}