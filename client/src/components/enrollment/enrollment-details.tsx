"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Program, FormData } from "./enrollment-types"

interface EnrollmentDetailsProps {
  program: Program | null
  isProgramLoading: boolean
  formData: FormData
  handleDateChange: (date: Date | undefined) => void
  getAttendanceLimit: () => string
  getFirstPaymentAmount: () => number
  getNextPaymentDate: () => Date | null
  isValidDate: (date?: Date) => boolean
  setActiveTab: (tab: string) => void
}

export function EnrollmentDetails({
  program,
  isProgramLoading,
  formData,
  handleDateChange,
  getAttendanceLimit,
  getFirstPaymentAmount,
  getNextPaymentDate,
  isValidDate,
  setActiveTab,
}: EnrollmentDetailsProps) {
  return (
    <>
      {isProgramLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading program details...</p>
        </div>
      ) : program ? (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Program Details</h2>
          <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Program:</span>
              <Badge variant="outline" className="font-medium text-slate-900 dark:text-slate-50 px-3 py-1 uppercase">
                {program.name}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Membership:</span>
              <Badge variant="outline" className="font-medium text-slate-900 dark:text-slate-50 px-3 py-1 uppercase">
                {program.offering.name}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Start Date:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-[240px] justify-start text-left font-normal ${!isValidDate(formData.enrollmentDate) && formData.enrollmentDate ? "border-red-500" : ""}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.enrollmentDate ? (
                      isValidDate(formData.enrollmentDate) ? (
                        format(formData.enrollmentDate, "PPP")
                      ) : (
                        "Date must be today or later"
                      )
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
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Attendance Limit:</span>
              <span className="font-medium text-slate-900 dark:text-slate-50">{getAttendanceLimit()}</span>
            </div>
          </div>

          <Separator className="my-6" />

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Membership Payment Details</h2>
          <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Sign-up Cost:</span>
              <span className="font-medium text-slate-900 dark:text-slate-50">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Membership Monthly Fees:</span>
              <span className="font-medium text-slate-900 dark:text-slate-50">${program.price.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="my-6" />

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Payment Schedule</h2>
          <div className="space-y-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">1st Payment due today:</span>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                $
                {formData.enrollmentDate && isValidDate(formData.enrollmentDate)
                  ? getFirstPaymentAmount().toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Next Payment due on:</span>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {formData.enrollmentDate && isValidDate(formData.enrollmentDate)
                  ? `${format(getNextPaymentDate() || new Date(), "PPP")} - ${program.price.toFixed(2)}`
                  : "Select valid start date"}
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
              disabled={!formData.enrollmentDate || !isValidDate(formData.enrollmentDate)}
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
    </>
  )
}