"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import type { FormData } from "./enrollment-types"

interface StudentInfoFormProps {
  formData: FormData
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  setActiveTab: (tab: string) => void
}

export function StudentInfoForm({ formData, handleChange, setActiveTab }: StudentInfoFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
        <Input id="childDOB" name="childDOB" type="date" value={formData.childDOB} onChange={handleChange} required />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="childEmail">
          Email Address <span className="text-red-500">*</span>
        </Label>
        <Input
          id="childEmail"
          name="childEmail"
          type="email"
          value={formData.childEmail}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="childPassword">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="childPassword"
              name="childPassword"
              type={showPassword ? "text" : "password"}
              value={formData.childPassword}
              onChange={handleChange}
              required
              className={
                formData.childConfirmPassword && formData.childPassword !== formData.childConfirmPassword
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
          <Label htmlFor="childConfirmPassword">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="childConfirmPassword"
              name="childConfirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.childConfirmPassword}
              onChange={handleChange}
              required
              className={
                formData.childConfirmPassword && formData.childPassword !== formData.childConfirmPassword
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
          {formData.childConfirmPassword && formData.childPassword !== formData.childConfirmPassword && (
            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="childPhone">Phone Number</Label>
        <Input id="childPhone" name="childPhone" value={formData.childPhone} onChange={handleChange} />
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={() => setActiveTab("parent")}>
          Back to Parent Info
        </Button>
        <Button type="button" onClick={() => setActiveTab("payment")}>
          Continue to Payment
        </Button>
      </div>
    </div>
  )
}
