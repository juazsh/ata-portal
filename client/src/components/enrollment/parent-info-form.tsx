"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import type { FormData } from "./enrollment-types"

interface ParentInfoFormProps {
  formData: FormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setActiveTab: (tab: string) => void
}

export function ParentInfoForm({ formData, handleChange, setActiveTab }: ParentInfoFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="parentPassword">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="parentPassword"
              name="parentPassword"
              type={showPassword ? "text" : "password"}
              value={formData.parentPassword}
              onChange={handleChange}
              required
              className={
                formData.parentConfirmPassword && formData.parentPassword !== formData.parentConfirmPassword
                  ? "border-red-500"
                  : ""
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentConfirmPassword">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="parentConfirmPassword"
              name="parentConfirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.parentConfirmPassword}
              onChange={handleChange}
              required
              className={
                formData.parentConfirmPassword && formData.parentPassword !== formData.parentConfirmPassword
                  ? "border-red-500"
                  : ""
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>
          {formData.parentConfirmPassword && formData.parentPassword !== formData.parentConfirmPassword && (
            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="parentPhone">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input id="parentPhone" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="parentAddress">
          Street Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="parentAddress"
          name="parentAddress"
          value={formData.parentAddress}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="parentCity">
            City <span className="text-red-500">*</span>
          </Label>
          <Input id="parentCity" name="parentCity" value={formData.parentCity} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentZip">
            Zip Code <span className="text-red-500">*</span>
          </Label>
          <Input id="parentZip" name="parentZip" value={formData.parentZip} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="parentState">
            State <span className="text-red-500">*</span>
          </Label>
          <Input id="parentState" name="parentState" value={formData.parentState} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentCountry">
            Country <span className="text-red-500">*</span>
          </Label>
          <Input
            id="parentCountry"
            name="parentCountry"
            value={formData.parentCountry}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
          Back to Enrollment Details
        </Button>
        <Button type="button" onClick={() => setActiveTab("child")}>
          Continue to Student Info
        </Button>
      </div>
    </div>
  )
}
