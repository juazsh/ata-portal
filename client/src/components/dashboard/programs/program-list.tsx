"use client"

import { BookIcon, InfoIcon, MoreVerticalIcon, PencilIcon, PlusIcon, TrashIcon, Loader2Icon, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ProgramList({
  programs,
  loading,
  error,
  isAdmin,
  onAddProgram,
  onEditProgram,
  onDeleteProgram,
  onViewDetails,
  onEnrollClick,
  fetchPrograms,
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading programs...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">Failed to load programs</p>
        <Button onClick={fetchPrograms}>Try Again</Button>
      </div>
    )
  }

  if (programs.length === 0) {
    return (
      <div className="p-8 text-center">
        <BookIcon className="h-12 w-12 mx-auto text-primary mb-4 opacity-50" />
        <p className="text-slate-600 dark:text-slate-400 mb-4">No programs available</p>
        {isAdmin && (
          <Button onClick={onAddProgram} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Your First Program
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <Card key={program._id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{program.name}</CardTitle>
                  {program.googleClassroomLink && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <LinkIcon className="h-4 w-4 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Google Classroom available</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <CardDescription>
                  {program.offering?.name} - {program.offering?.type}
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
                    <DropdownMenuItem onClick={() => onEditProgram(program)}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteProgram(program)}>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">{program.description}</p>
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Price:</span>
                <span className="ml-1 font-medium">${program.price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                <span className="ml-1 font-medium">{program.estimatedDuration} hrs</span>
              </div>
            </div>
            {program.modules?.length > 0 && (
              <div className="mt-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Modules:</span>
                <span className="ml-1 font-medium text-sm">{program.modules.length}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 flex items-center gap-2" onClick={() => onViewDetails(program)}>
              <InfoIcon className="h-4 w-4" />
              View Details
            </Button>
            {isAdmin ? null : (
              <Button
                variant="default"
                className="flex-1 flex items-center gap-2"
                onClick={() => onEnrollClick(program)}
              >
                <PlusIcon className="h-4 w-4" />
                Enroll Student
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}