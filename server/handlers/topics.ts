import { Request, Response } from "express";
import { Topic, Module } from "../models/program";
import mongoose from "mongoose";

export const getAllTopics = async (req: Request, res: Response) => {
  try {
    const topics = await Topic.find()
      .populate("module", "name program");

    res.status(200).json(topics);
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ message: "Failed to fetch topics", error: (error as Error).message });
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "Invalid Topic ID format" });
    }

    const topic = await Topic.findById(topicId)
      .populate("module", "name program");

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.status(200).json(topic);
  } catch (error) {
    console.error("Error fetching topic by ID:", error);
    res.status(500).json({ message: "Failed to fetch topic", error: (error as Error).message });
  }
};

export const getTopicsByModule = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ message: "Invalid Module ID format" });
    }

    const topics = await Topic.find({ module: moduleId });

    res.status(200).json(topics);
  } catch (error) {
    console.error("Error fetching topics by module:", error);
    res.status(500).json({ message: "Failed to fetch topics", error: (error as Error).message });
  }
};

export const addTopic = async (req: Request, res: Response) => {
  try {
    const { name, description, estimatedDuration, taughtBy, module: moduleId } = req.body;

    if (!name || !description || estimatedDuration === undefined) {
      return res.status(400).json({
        message: "Missing required fields: name, description, estimatedDuration"
      });
    }

    if (moduleId) {
      if (!mongoose.Types.ObjectId.isValid(moduleId)) {
        return res.status(400).json({ message: "Invalid Module ID format" });
      }

      const moduleExists = await Module.findById(moduleId);
      if (!moduleExists) {
        return res.status(404).json({ message: `Module with ID ${moduleId} not found.` });
      }
    }

    const newTopic = new Topic({
      name,
      description,
      estimatedDuration,
      taughtBy,
      module: moduleId || null,
    });

    const savedTopic = await newTopic.save();

    if (moduleId) {
      await Module.findByIdAndUpdate(moduleId, { $addToSet: { topics: savedTopic._id } });
    }

    const populatedTopic = await Topic.findById(savedTopic._id)
      .populate("module", "name program");

    res.status(201).json(populatedTopic);
  } catch (error) {
    console.error("Error adding topic:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to add topic", error: (error as Error).message });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "Invalid Topic ID format" });
    }

    const currentTopic = await Topic.findById(topicId);
    if (!currentTopic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    if (updateData.module !== undefined) {
      if (!updateData.module && currentTopic.module) {
        await Module.findByIdAndUpdate(currentTopic.module, {
          $pull: { topics: topicId }
        });
      }
      else if (updateData.module) {
        if (!mongoose.Types.ObjectId.isValid(updateData.module)) {
          return res.status(400).json({ message: "Invalid Module ID format in update data" });
        }

        const moduleExists = await Module.findById(updateData.module);
        if (!moduleExists) {
          return res.status(404).json({ message: `Module with ID ${updateData.module} not found.` });
        }

        if (currentTopic.module && currentTopic.module.toString() !== updateData.module.toString()) {
          await Module.findByIdAndUpdate(currentTopic.module, {
            $pull: { topics: topicId }
          });
        }

        await Module.findByIdAndUpdate(updateData.module, {
          $addToSet: { topics: topicId }
        });
      }
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      topicId,
      updateData,
      { new: true, runValidators: true }
    ).populate("module", "name program");

    res.status(200).json(updatedTopic);
  } catch (error) {
    console.error("Error updating topic:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update topic", error: (error as Error).message });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "Invalid Topic ID format" });
    }

    const deletedTopic = await Topic.findByIdAndDelete(topicId);
    if (!deletedTopic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    if (deletedTopic.module) {
      await Module.findByIdAndUpdate(deletedTopic.module, {
        $pull: { topics: deletedTopic._id }
      });
    }

    res.status(200).json({ message: "Topic deleted successfully", topicId: deletedTopic._id });
  } catch (error) {
    console.error("Error deleting topic:", error);
    res.status(500).json({ message: "Failed to delete topic", error: (error as Error).message });
  }
};