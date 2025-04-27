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
import { Loader2Icon } from "lucide-react"

export function ModuleModal({ open, onOpenChange, currentModule, programId, onSuccess }) {
  const { toast } = useToast()
  const [moduleFormData, setModuleFormData] = useState({
    name: "",
    description: "",
    estimatedDuration: 0,
    program: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentModule) {
      setModuleFormData({
        name: currentModule.name,
        description: currentModule.description,
        estimatedDuration: currentModule.estimatedDuration,
        program: currentModule.program,
      })
    } else {
      resetModuleForm()
    }
  }, [currentModule, programId, open])

  const resetModuleForm = () => {
    setModuleFormData({
      name: "",
      description: "",
      estimatedDuration: 0,
      program: programId || "",
    })
  }

  const handleModuleInputChange = (e) => {
    const { name, value } = e.target
    setModuleFormData((prev) => ({
      ...prev,
      [name]: name === "estimatedDuration" ? Number.parseFloat(value) : value,
    }))
  }

  const handleModuleFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const url = currentModule ? `/api/modules/${currentModule._id}` : "/api/modules"

      const method = currentModule ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(moduleFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${currentModule ? "update" : "create"} module`)
      }

      toast({
        title: "Success",
        description: `Module ${currentModule ? "updated" : "created"} successfully`,
      })

      onSuccess()
      onOpenChange(false)
      resetModuleForm()
    } catch (err) {
      console.error(`Error ${currentModule ? "updating" : "creating"} module:`, err)
      toast({
        title: "Error",
        description: err.message || `Failed to ${currentModule ? "update" : "create"} module`,
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
          <DialogTitle>{currentModule ? "Edit Module" : "Add New Module"}</DialogTitle>
          <DialogDescription>
            {currentModule
              ? "Update the details of the existing module."
              : "Fill out the form below to create a new module."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleModuleFormSubmit} className="space-y-4 mt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="module-name">Module Name*</Label>
            <Input
              id="module-name"
              name="name"
              value={moduleFormData.name}
              onChange={handleModuleInputChange}
              required
              placeholder="Enter module name"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="module-description">Description*</Label>
            <Textarea
              id="module-description"
              name="description"
              value={moduleFormData.description}
              onChange={handleModuleInputChange}
              required
              placeholder="Enter module description"
              rows={4}
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="module-estimatedDuration">Duration (hours)*</Label>
            <Input
              id="module-estimatedDuration"
              name="estimatedDuration"
              type="number"
              value={moduleFormData.estimatedDuration}
              onChange={handleModuleInputChange}
              required
              min="0"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !moduleFormData.name || !moduleFormData.description}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {currentModule ? "Updating..." : "Creating..."}
                </>
              ) : currentModule ? (
                "Update Module"
              ) : (
                "Create Module"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
