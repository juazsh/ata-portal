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

export function TopicModal({ open, onOpenChange, currentTopic, moduleId, onSuccess }) {
  const { toast } = useToast()
  const [topicFormData, setTopicFormData] = useState({
    name: "",
    description: "",
    estimatedDuration: 0,
    module: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentTopic) {
      setTopicFormData({
        name: currentTopic.name,
        description: currentTopic.description,
        estimatedDuration: currentTopic.estimatedDuration,
        module: currentTopic.module,
      })
    } else {
      resetTopicForm()
    }
  }, [currentTopic, moduleId, open])

  const resetTopicForm = () => {
    setTopicFormData({
      name: "",
      description: "",
      estimatedDuration: 0,
      module: moduleId || "",
    })
  }

  const handleTopicInputChange = (e) => {
    const { name, value } = e.target
    setTopicFormData((prev) => ({
      ...prev,
      [name]: name === "estimatedDuration" ? Number.parseFloat(value) : value,
    }))
  }

  const handleTopicFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("Authentication required")
      }

      const url = currentTopic ? `/api/topics/${currentTopic._id}` : "/api/topics"

      const method = currentTopic ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(topicFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${currentTopic ? "update" : "create"} topic`)
      }

      toast({
        title: "Success",
        description: `Topic ${currentTopic ? "updated" : "created"} successfully`,
      })

      onSuccess()
      onOpenChange(false)
      resetTopicForm()
    } catch (err) {
      console.error(`Error ${currentTopic ? "updating" : "creating"} topic:`, err)
      toast({
        title: "Error",
        description: err.message || `Failed to ${currentTopic ? "update" : "create"} topic`,
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
          <DialogTitle>{currentTopic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
          <DialogDescription>
            {currentTopic
              ? "Update the details of the existing topic."
              : "Fill out the form below to create a new topic."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTopicFormSubmit} className="space-y-4 mt-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="topic-name">Topic Name*</Label>
            <Input
              id="topic-name"
              name="name"
              value={topicFormData.name}
              onChange={handleTopicInputChange}
              required
              placeholder="Enter topic name"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="topic-description">Description*</Label>
            <Textarea
              id="topic-description"
              name="description"
              value={topicFormData.description}
              onChange={handleTopicInputChange}
              required
              placeholder="Enter topic description"
              rows={4}
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="topic-estimatedDuration">Duration (hours)*</Label>
            <Input
              id="topic-estimatedDuration"
              name="estimatedDuration"
              type="number"
              value={topicFormData.estimatedDuration}
              onChange={handleTopicInputChange}
              required
              min="0"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !topicFormData.name || !topicFormData.description}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {currentTopic ? "Updating..." : "Creating..."}
                </>
              ) : currentTopic ? (
                "Update Topic"
              ) : (
                "Create Topic"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
