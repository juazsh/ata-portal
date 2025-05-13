"use client"

import { Clock, MoreVerticalIcon, PencilIcon, PlusIcon, TrashIcon, Loader2Icon, Users, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function ClassSessionList({
  sessions,
  loading,
  error,
  isAdmin,
  onAddSession,
  onEditSession,
  onDeleteSession,
  onViewDetails,
  fetchSessions,
  programs,
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading class sessions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">Failed to load class sessions</p>
        <Button onClick={fetchSessions}>Try Again</Button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center">
        <Clock className="h-12 w-12 mx-auto text-primary mb-4 opacity-50" />
        <p className="text-slate-600 dark:text-slate-400 mb-4">No class sessions available</p>
        {isAdmin && (
          <Button onClick={onAddSession} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Your First Class Session
          </Button>
        )}
      </div>
    )
  }

  // Helper function to find program name by ID
  const getProgramName = (programId) => {
    if (!programId) return "No Program"
    const program = programs?.find(p => p._id === programId)
    return program ? program.name : "Unknown Program"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <Card key={session.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{session.weekday}</CardTitle>
                <CardDescription>
                  {session.program_id ? (
                    <>
                      {typeof session.program_id === 'object' && session.program_id.name
                        ? session.program_id.name
                        : getProgramName(session.program_id)}
                    </>
                  ) : (
                    "No Program Assigned"
                  )}
                </CardDescription>
              </div>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(session)}>
                      <InfoIcon className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditSession(session)}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteSession(session)}>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-sm">
                  {session.start_time} - {session.end_time}
                </span>
              </div>
              <div className="flex items-center">
                <Badge variant={session.type === "weekday" ? "outline" : "secondary"} className="mr-2">
                  {session.type === "weekday" ? "Weekday" : "Weekend"}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t pt-4">
            <div className="flex justify-between text-sm w-full">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">Regular: {session.regular_capacity}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-slate-600 dark:text-slate-400">Demo: {session.capacity_demo}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onViewDetails(session)}
            >
              <InfoIcon className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}