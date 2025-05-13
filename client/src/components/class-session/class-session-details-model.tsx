"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Users, Calendar, Bookmark, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function ClassSessionDetailsModal({ open, onOpenChange, session, programs }) {
  if (!session) return null

  // Helper function to find program name by ID
  const getProgramName = (programId) => {
    if (!programId) return "No Program"
    const program = programs?.find(p => p._id === programId)
    return program ? program.name : "Unknown Program"
  }

  // Format the program name based on the session data structure
  const programName = session.program_id
    ? (typeof session.program_id === 'object' && session.program_id.name
      ? session.program_id.name
      : getProgramName(session.program_id))
    : "No Program Assigned"

  // Visual indication of session type
  const sessionTypeColor = session.type === "weekday" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {session.weekday} Class Session
          </DialogTitle>
          <Badge
            variant={session.type === "weekday" ? "outline" : "secondary"}
            className="mt-2 w-fit"
          >
            {session.type === "weekday" ? "Weekday" : "Weekend"}
          </Badge>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Time Information */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 p-2 rounded-full dark:bg-slate-800">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Time</h3>
              <p className="text-base font-medium">{session.start_time} - {session.end_time}</p>
            </div>
          </div>

          {/* Program Information */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 p-2 rounded-full dark:bg-slate-800">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Program</h3>
              <p className="text-base font-medium">{programName}</p>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Capacity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg dark:bg-slate-800">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Regular</span>
                </div>
                <p className="text-xl font-bold mt-1">{session.regular_capacity}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg dark:bg-slate-800">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Demo</span>
                </div>
                <p className="text-xl font-bold mt-1">{session.capacity_demo}</p>
              </div>
            </div>
          </div>

          {/* Created/Updated Information */}
          {session.createdAt && session.updatedAt && (
            <div className="border-t pt-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
                <span>Last Updated: {new Date(session.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}