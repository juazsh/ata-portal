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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2Icon } from "lucide-react"

export function ProgramModal({ open, onOpenChange, currentProgram, offerings, onSuccess }) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    estimatedDuration: 0,
    offering: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentProgram) {
      setFormData({
        name: currentProgram.name,
        description: currentProgram.description,
        price: currentProgram.price,
        estimatedDuration: currentProgram.estimatedDuration,
        offering: currentProgram.offering._id,
      })
    } else {
      resetForm()
    }
  }, [currentProgram, open])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      estimatedDuration: 0,
      offering: "",
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "estimatedDuration" ? Number.parseFloat(value) : value,
    }))
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

      const url = currentProgram ? `/api/programs/${currentProgram._id}` : "/api/programs"

      const method = currentProgram ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${currentProgram ? "update" : "create"} program`)
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Program ${currentProgram ? "updated" : "created"} successfully`,
      })

      onSuccess(result)
      onOpenChange(false)
      resetForm()
    } catch (err) {
      console.error(`Error ${currentProgram ? "updating" : "creating"} program:`, err)
      toast({
        title: "Error",
        description: err.message || `Failed to ${currentProgram ? "update" : "create"} program`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{currentProgram ? "Edit Program" : "Add New Program"}</DialogTitle>
          <DialogDescription>
            {currentProgram
              ? "Update the details of the existing program."
              : "Fill out the form below to create a new program."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="name">Program Name*</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter program name"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Enter program description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="price">Price ($)*</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="estimatedDuration">Duration (hours)*</Label>
              <Input
                id="estimatedDuration"
                name="estimatedDuration"
                type="number"
                value={formData.estimatedDuration}
                onChange={handleInputChange}
                required
                min="0"
              />
            </div>
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="offering">Offering*</Label>
            <Select
              name="offering"
              value={formData.offering}
              onValueChange={(value) => handleSelectChange("offering", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an offering" />
              </SelectTrigger>
              <SelectContent>
                {offerings.map((offering) => (
                  <SelectItem key={offering._id} value={offering._id}>
                    {offering.name} ({offering.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {offerings.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No offerings available. Create an offering first.</p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.name || !formData.description || !formData.offering || offerings.length === 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {currentProgram ? "Updating..." : "Creating..."}
                </>
              ) : currentProgram ? (
                "Update Program"
              ) : (
                "Create Program"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
