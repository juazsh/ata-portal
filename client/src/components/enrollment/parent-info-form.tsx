"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FormData } from "./enrollment-types"

interface ParentInfoFormProps {
  formData: FormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setActiveTab: (tab: string) => void
}

export function ParentInfoForm({ formData, handleChange, setActiveTab }: ParentInfoFormProps) {
  // Function to check if all required fields are completed
  const isParentInfoComplete = () => {
    return (
      formData.parentFirstName.trim() !== "" &&
      formData.parentLastName.trim() !== "" &&
      formData.parentEmail.trim() !== "" &&
      formData.parentPhone.trim() !== ""
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Parent Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentFirstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="parentFirstName"
            name="parentFirstName"
            value={formData.parentFirstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentLastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="parentLastName"
            name="parentLastName"
            value={formData.parentLastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="parentEmail">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="parentEmail"
          name="parentEmail"
          type="email"
          value={formData.parentEmail}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="parentPhone">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input id="parentPhone" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required />
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
          Back to Enrollment Details
        </Button>
        <Button type="button" onClick={() => setActiveTab("child")} disabled={!isParentInfoComplete()}>
          Continue to Student Info
        </Button>
      </div>
    </div>
  )
}