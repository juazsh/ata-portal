"use client"

import { useState } from "react"
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

export function OfferingModal({ open, onOpenChange, onSuccess }) {
  const { toast } = useToast()
  const [offeringFormData, setOfferingFormData] = useState({
    name: "",
    description: "",
    estimatedDuration: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetOfferingForm = () => {
    setOfferingFormData({
      name: "",
      description: "",
      estimatedDuration: 0,
    })
  }

  const handleOfferingInputChange = (e) => {
    const { name, value } = e.target
    setOfferingFormData((prev) => ({
      ...prev,
      [name]: name === "estimatedDuration" ? Number.parseFloat(value) : value,
    }))
  }

  const handleOfferingFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch("/api/offerings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(offeringFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create offering")
      }

      const newOffering = await response.json()

      toast({
        title: "Success",
        description: "Offering created successfully",
      })

      onSuccess(newOffering)
      onOpenChange(false)
      resetOfferingForm()
    } catch (err) {
      console.error("Error creating offering:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create offering",
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
          <DialogTitle>Add New Offering</DialogTitle>
          <DialogDescription>Fill out the form below to create a new offering.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleOfferingFormSubmit} className="space-y-4 mt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="name">Offering Name*</Label>
            <Input
              id="name"
              name="name"
              value={offeringFormData.name}
              onChange={handleOfferingInputChange}
              required
              placeholder="Enter offering name"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              name="description"
              value={offeringFormData.description}
              onChange={handleOfferingInputChange}
              required
              placeholder="Enter offering description"
              rows={4}
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="estimatedDuration">Duration (hours)*</Label>
            <Input
              id="estimatedDuration"
              name="estimatedDuration"
              type="number"
              value={offeringFormData.estimatedDuration}
              onChange={handleOfferingInputChange}
              required
              min="0"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !offeringFormData.name || !offeringFormData.description}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Offering"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
