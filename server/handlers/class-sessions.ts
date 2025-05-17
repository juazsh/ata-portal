import { Request, Response } from "express";
import { ClassSession } from "../models/class-session";
import { Program } from "../models/program";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const updateSessionCapacity = async (sessionId: string, isDemo: boolean = false): Promise<boolean> => {
  try {
    const session = await ClassSession.findOne({ id: sessionId });

    if (!session) {
      return false;
    }

    if (isDemo) {

      if (session.available_demo_capacity > 0) {
        session.available_demo_capacity -= 1;
        await session.save();
        return true;
      }
    } else {

      if (session.available_capacity > 0) {
        session.available_capacity -= 1;
        await session.save();
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error updating session capacity:", error);
    return false;
  }
};

export const getAllClassSessions = async (req: Request, res: Response) => {
  try {
    const { program_id } = req.query;

    let query = {};

    if (program_id && mongoose.Types.ObjectId.isValid(program_id as string)) {
      query = { program_id: program_id };
    }

    const sessions = await ClassSession.find(query)
      .populate("program_id", "name")
      .sort({ weekday: 1, start_time: 1 });

    res.status(200).json({
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("Error fetching class sessions:", error);
    res.status(500).json({
      message: "Failed to fetch class sessions",
      error: (error as Error).message
    });
  }
};

export const getClassSessionById = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await ClassSession.findOne({ id: sessionId })
      .populate("program_id", "name description");

    if (!session) {
      return res.status(404).json({ message: "Class session not found" });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching class session:", error);
    res.status(500).json({
      message: "Failed to fetch class session",
      error: (error as Error).message
    });
  }
};

export const addClassSession = async (req: Request, res: Response) => {
  try {
    const {
      program_id,
      weekday,
      start_time,
      end_time,
      type,
      total_capacity,
      total_demo_capacity
    } = req.body;

    if (!weekday || !start_time || !end_time || !type ||
      total_capacity === undefined || total_demo_capacity === undefined) {
      return res.status(400).json({
        message: "Missing required fields: weekday, start_time, end_time, type, total_capacity, total_demo_capacity"
      });
    }

    const validWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    if (!validWeekdays.includes(weekday)) {
      return res.status(400).json({
        message: "Invalid weekday. Must be one of: " + validWeekdays.join(", ")
      });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        message: "Invalid time format. Must be in HH:MM format (24-hour)"
      });
    }

    if (type !== "weekday" && type !== "weekend") {
      return res.status(400).json({
        message: "Invalid type. Must be either 'weekday' or 'weekend'"
      });
    }

    if (total_capacity < 0 || total_demo_capacity < 0) {
      return res.status(400).json({
        message: "Capacities must be positive numbers"
      });
    }

    if (program_id && mongoose.Types.ObjectId.isValid(program_id)) {
      const programExists = await Program.findById(program_id);
      if (!programExists) {
        return res.status(400).json({
          message: `Program with ID ${program_id} not found`
        });
      }
    }

    const sessionId = uuidv4();

    const newSession = new ClassSession({
      id: sessionId,
      program_id: program_id || null,
      weekday,
      start_time,
      end_time,
      type,
      total_capacity,
      available_capacity: total_capacity,
      total_demo_capacity,
      available_demo_capacity: total_demo_capacity
    });

    const savedSession = await newSession.save();

    const populatedSession = await ClassSession.findById(savedSession._id)
      .populate("program_id", "name");

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error("Error adding class session:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A class session with these details already exists"
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors
      });
    }

    res.status(500).json({
      message: "Failed to add class session",
      error: (error as Error).message
    });
  }
};

export const updateClassSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;

    const session = await ClassSession.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({ message: "Class session not found" });
    }

    if (updateData.program_id && mongoose.Types.ObjectId.isValid(updateData.program_id)) {
      const programExists = await Program.findById(updateData.program_id);
      if (!programExists) {
        return res.status(400).json({
          message: `Program with ID ${updateData.program_id} not found`
        });
      }
    }

    if (updateData.weekday) {
      const validWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      if (!validWeekdays.includes(updateData.weekday)) {
        return res.status(400).json({
          message: "Invalid weekday. Must be one of: " + validWeekdays.join(", ")
        });
      }
    }

    if (updateData.start_time || updateData.end_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      if (updateData.start_time && !timeRegex.test(updateData.start_time)) {
        return res.status(400).json({
          message: "Invalid start_time format. Must be in HH:MM format (24-hour)"
        });
      }

      if (updateData.end_time && !timeRegex.test(updateData.end_time)) {
        return res.status(400).json({
          message: "Invalid end_time format. Must be in HH:MM format (24-hour)"
        });
      }
    }

    if (updateData.type && updateData.type !== "weekday" && updateData.type !== "weekend") {
      return res.status(400).json({
        message: "Invalid type. Must be either 'weekday' or 'weekend'"
      });
    }


    if (updateData.total_capacity !== undefined) {
      if (updateData.total_capacity < 0) {
        return res.status(400).json({
          message: "Total capacity must be a positive number"
        });
      }


      const capacityDifference = updateData.total_capacity - session.total_capacity;


      updateData.available_capacity = Math.max(0, session.available_capacity + capacityDifference);
    }

    if (updateData.total_demo_capacity !== undefined) {
      if (updateData.total_demo_capacity < 0) {
        return res.status(400).json({
          message: "Demo capacity must be a positive number"
        });
      }


      const demoCapacityDifference = updateData.total_demo_capacity - session.total_demo_capacity;


      updateData.available_demo_capacity = Math.max(0, session.available_demo_capacity + demoCapacityDifference);
    }

    const updatedSession = await ClassSession.findOneAndUpdate(
      { id: sessionId },
      updateData,
      { new: true, runValidators: true }
    ).populate("program_id", "name");

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error updating class session:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A class session with these details already exists"
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors
      });
    }

    res.status(500).json({
      message: "Failed to update class session",
      error: (error as Error).message
    });
  }
};

export const deleteClassSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const deletedSession = await ClassSession.findOneAndDelete({ id: sessionId });

    if (!deletedSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    res.status(200).json({
      message: "Class session deleted successfully",
      sessionId: deletedSession.id
    });
  } catch (error) {
    console.error("Error deleting class session:", error);
    res.status(500).json({
      message: "Failed to delete class session",
      error: (error as Error).message
    });
  }
};