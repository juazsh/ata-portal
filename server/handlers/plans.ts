import { Request, Response } from "express"
import { Plan } from "../models/plan"
import mongoose from "mongoose"

export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 })
    res.json(plans)
  } catch (error) {
    console.error("Error fetching plans:", error)
    res.status(500).json({ message: "Failed to fetch plans" })
  }
}

export const getPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const plan = await Plan.findOne({ id })
    
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" })
    }
    
    res.json(plan)
  } catch (error) {
    console.error("Error fetching plan:", error)
    res.status(500).json({ message: "Failed to fetch plan" })
  }
}

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body
    
    if (!name || !description) {
      return res.status(400).json({ 
        message: "Missing required fields: name and description are required" 
      })
    }
    
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: "Plan name must be a non-empty string" })
    }
    
    if (typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ message: "Plan description must be a non-empty string" })
    }
    
    const existingPlan = await Plan.findOne({ name: name.trim() })
    if (existingPlan) {
      return res.status(409).json({ message: "A plan with this name already exists" })
    }
    
    const planData = {
      name: name.trim(),
      description: description.trim()
    }
    
    const plan = new Plan(planData)
    const createdPlan = await plan.save()
    
    res.status(201).json(createdPlan)
  } catch (error) {
    console.error("Error creating plan:", error)
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      })
    }
    
    if ((error as any).code === 11000) {
      return res.status(409).json({ message: "A plan with this information already exists" })
    }
    
    res.status(500).json({ message: "Failed to create plan" })
  }
}

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    
    const existingPlan = await Plan.findOne({ id })
    if (!existingPlan) {
      return res.status(404).json({ message: "Plan not found" })
    }
    
    const updateData: any = {}
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: "Plan name must be a non-empty string" })
      }
      
      const duplicatePlan = await Plan.findOne({ 
        name: name.trim(), 
        id: { $ne: id } 
      })
      if (duplicatePlan) {
        return res.status(409).json({ message: "A plan with this name already exists" })
      }
      
      updateData.name = name.trim()
    }
    
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ message: "Plan description must be a non-empty string" })
      }
      updateData.description = description.trim()
    }
    
    const updatedPlan = await Plan.findOneAndUpdate(
      { id }, 
      updateData, 
      { new: true, runValidators: true }
    )
    
    res.json(updatedPlan)
  } catch (error) {
    console.error("Error updating plan:", error)
    
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors 
      })
    }
    
    if ((error as any).code === 11000) {
      return res.status(409).json({ message: "A plan with this information already exists" })
    }
    
    res.status(500).json({ message: "Failed to update plan" })
  }
}

export const removePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deletedPlan = await Plan.findOneAndDelete({ id })
    
    if (!deletedPlan) {
      return res.status(404).json({ message: "Plan not found" })
    }
    
    res.status(200).json({ 
      message: "Plan deleted successfully",
      deletedPlan: {
        id: deletedPlan.id,
        name: deletedPlan.name
      }
    })
  } catch (error) {
    console.error("Error removing plan:", error)
    res.status(500).json({ message: "Failed to remove plan" })
  }
}