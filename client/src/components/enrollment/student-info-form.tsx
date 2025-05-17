"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormData } from "./enrollment-types"

interface StudentInfoFormProps {
  formData: FormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setActiveTab: (tab: string) => void
}

export function StudentInfoForm({ formData, handleChange, setActiveTab }: StudentInfoFormProps) {
  const isStudentInfoComplete = () => {
    return (
      formData.childFirstName.trim() !== "" &&
      formData.childLastName.trim() !== "" &&
      formData.childDOB.trim() !== ""
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Student Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="childFirstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="childFirstName"
            name="childFirstName"
            value={formData.childFirstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="childLastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="childLastName"
            name="childLastName"
            value={formData.childLastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="childDOB">
          Date of Birth <span className="text-red-500">*</span>
        </Label>
        <Input
          id="childDOB"
          name="childDOB"
          type="date"
          value={formData.childDOB}
          onChange={handleChange}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 6)).toISOString().split('T')[0]}
          min={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          required
        />
        <p className="text-sm text-slate-500">Student must be between 6 and 18 years old</p>
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => setActiveTab("parent")}>
          Back to Parent Info
        </Button>
        <Button
          type="button"
          onClick={() => setActiveTab("payment")}
          disabled={!isStudentInfoComplete()}
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  )
}