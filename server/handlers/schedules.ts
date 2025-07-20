import { Request, Response } from "express";
import { Schedule } from "../models/schedule";
import { Location } from "../models/location";
import { Session } from "../models/sessions";
import { Program } from "../models/program";
import { Plan } from "../models/plan";
import { Offering } from "../models/offering";
import mongoose from "mongoose";

interface AuthenticatedRequest extends Request {
  user: any; 
}

const hasGlobalAccess = (user: any): boolean => {
  return user.role === 'owner';
};

const canAccessLocation = (user: any, locationId: string): boolean => {
  return (!user) 
        ? false 
        : (user.role === 'owner') 
          ? true 
          : (['location_manager', 'admin', 'teacher'].includes(user.role))
            ? user.locationId === locationId
            : (['parent', 'student'].includes(user.role))
              ? !user.locationId || user.locationId === locationId
              : false; 
};

const canManageSchedules = (user: any, locationId?: string): boolean => {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (['location_manager', 'admin'].includes(user.role)) {
    return locationId ? user.locationId === locationId : true;
  }
  return false;
};

const validateUser = (req: AuthenticatedRequest, res: Response): boolean => {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }
  if (!req.user.role) {
    res.status(401).json({ message: "User role not found" });
    return false;
  }
  return true;
};

export const getAllSchedules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!validateUser(req, res)) return;

    const { date, locationId, sessionId, programId, planId, active } = req.query;
    
    let query: any = {};
    
    if (date) {
      const queryDate = new Date(date as string);
      if (isNaN(queryDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (sessionId) query.sessionId = sessionId;
    if (programId) query.programId = programId;
    if (planId) query.planId = planId;
    if (active !== undefined) query.active = active === 'true';

    if (!hasGlobalAccess(req.user)) {
      if (!req.user.locationId) {
        return res.status(200).json([]);
      }
      query.locationId = req.user.locationId;
    } else if (locationId) {
      query.locationId = locationId;
    }

    const schedules = await Schedule.find(query)
      .select("id date totalCapacity demoCapacity availableCapacity availableDemoCapacity locationId sessionId programId planId active")
      .sort({ date: 1, createdAt: -1 })
      .lean();

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({
      message: "Failed to fetch schedules",
      error: (error as Error).message,
    });
  }
};

export const getScheduleById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const schedule = await Schedule.findOne({ id: scheduleId })
      .select("id date totalCapacity demoCapacity availableCapacity availableDemoCapacity locationId sessionId programId planId active")
      .lean();

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (!canAccessLocation(req.user, schedule.locationId)) {
      return res.status(403).json({ message: "Access denied for this schedule" });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedule by ID:", error);
    res.status(500).json({
      message: "Failed to fetch schedule",
      error: (error as Error).message,
    });
  }
};

export const createSchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      date,
      totalCapacity,
      demoCapacity,
      locationId,
      sessionId,
      programId,
      planId,
      active
    } = req.body;

    if (!canManageSchedules(req.user, locationId)) {
      return res.status(403).json({ message: "Insufficient permissions to create schedules for this location" });
    }

    if (!date || !totalCapacity || demoCapacity === undefined || !locationId || !sessionId) {
      return res.status(400).json({
        message: "Missing required fields: date, totalCapacity, demoCapacity, locationId, and sessionId are required"
      });
    }

    if ((!programId && !planId) || (programId && planId)) {
      return res.status(400).json({
        message: "Either programId or planId must be provided, but not both"
      });
    }

    const scheduleDate = new Date(date);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduleDate < today) {
      return res.status(400).json({ message: "Cannot create schedule for past dates" });
    }

    const totalCap = parseInt(totalCapacity);
    const demoCap = parseInt(demoCapacity);
    
    if (isNaN(totalCap) || totalCap < 1) {
      return res.status(400).json({ message: "Total capacity must be a positive integer" });
    }
    
    if (isNaN(demoCap) || demoCap < 0) {
      return res.status(400).json({ message: "Demo capacity must be a non-negative integer" });
    }

    if (demoCap > totalCap) {
      return res.status(400).json({ message: "Demo capacity cannot exceed total capacity" });
    }

    const location = await Location.findOne({ id: locationId, active: true });
    if (!location) {
      return res.status(400).json({ message: "Location not found or inactive" });
    }

    if (!canAccessLocation(req.user, locationId)) {
      return res.status(403).json({ message: "Access denied for this location" });
    }

    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      return res.status(400).json({ message: "Session not found" });
    }

    if (programId) {
      const program = await Program.findOne({ id: programId });
      if (!program) {
        return res.status(400).json({ message: "Program not found" });
      }

      const hasProgram = location.offerings.some(offering => 
        offering.programs?.some(prog => prog.id === programId)
      );
      
      if (!hasProgram) {
        return res.status(400).json({ message: "Program is not available at this location" });
      }

      const offering = await Offering.findOne({ id: program.offering });
      if (offering && offering.name === "Marathon") {
        return res.status(400).json({ message: "Programs cannot be used for Marathon schedules" });
      }
    }

    if (planId) {
      const plan = await Plan.findOne({ id: planId });
      if (!plan) {
        return res.status(400).json({ message: "Plan not found" });
      }

      const hasMarathonPlan = location.offerings.some(offering => 
        offering.name === "Marathon" && offering.plans?.some(p => p.id === planId)
      );
      
      if (!hasMarathonPlan) {
        return res.status(400).json({ message: "Plan is not available at this location or not part of Marathon offering" });
      }
    }

    const duplicateQuery: any = {
      locationId,
      sessionId,
      date: {
        $gte: new Date(scheduleDate.setHours(0, 0, 0, 0)),
        $lte: new Date(scheduleDate.setHours(23, 59, 59, 999))
      }
    };

    if (programId) duplicateQuery.programId = programId;
    if (planId) duplicateQuery.planId = planId;

    const existingSchedule = await Schedule.findOne(duplicateQuery);
    if (existingSchedule) {
      return res.status(409).json({ 
        message: "A schedule with the same location, session, date, and program/plan already exists" 
      });
    }

    const newSchedule = new Schedule({
      date: scheduleDate,
      totalCapacity: totalCap,
      demoCapacity: demoCap,
      availableCapacity: totalCap,
      availableDemoCapacity: demoCap,
      locationId,
      sessionId,
      programId: programId || undefined,
      planId: planId || undefined,
      active: active !== undefined ? Boolean(active) : true
    });

    const savedSchedule = await newSchedule.save();

    const response = await Schedule.findOne({ id: savedSchedule.id })
      .select("id date totalCapacity demoCapacity availableCapacity availableDemoCapacity locationId sessionId programId planId active")
      .lean();

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Error creating schedule:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "A schedule with this combination already exists" });
    }

    res.status(500).json({
      message: "Failed to create schedule",
      error: error.message,
    });
  }
};

export const updateSchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const {
      date,
      totalCapacity,
      demoCapacity,
      availableCapacity,
      availableDemoCapacity,
      locationId,
      sessionId,
      programId,
      planId,
      active
    } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const existingSchedule = await Schedule.findOne({ id: scheduleId });
    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (!canManageSchedules(req.user, existingSchedule.locationId)) {
      return res.status(403).json({ message: "Insufficient permissions to update this schedule" });
    }

    if (locationId && locationId !== existingSchedule.locationId) {
      if (!canManageSchedules(req.user, locationId)) {
        return res.status(403).json({ message: "Insufficient permissions for the new location" });
      }
    }

    if (active !== undefined && !hasGlobalAccess(req.user)) {
      return res.status(403).json({ message: "Only owners can change schedule active status" });
    }

    const updateData: any = {};

    if (date !== undefined) {
      const scheduleDate = new Date(date);
      if (isNaN(scheduleDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (scheduleDate < today) {
        return res.status(400).json({ message: "Cannot update to past dates" });
      }

      updateData.date = scheduleDate;
    }

    if (totalCapacity !== undefined) {
      const totalCap = parseInt(totalCapacity);
      if (isNaN(totalCap) || totalCap < 1) {
        return res.status(400).json({ message: "Total capacity must be a positive integer" });
      }
      updateData.totalCapacity = totalCap;
    }

    if (demoCapacity !== undefined) {
      const demoCap = parseInt(demoCapacity);
      if (isNaN(demoCap) || demoCap < 0) {
        return res.status(400).json({ message: "Demo capacity must be a non-negative integer" });
      }
      updateData.demoCapacity = demoCap;
    }

    const finalTotalCap = updateData.totalCapacity || existingSchedule.totalCapacity;
    const finalDemoCap = updateData.demoCapacity || existingSchedule.demoCapacity;
    
    if (finalDemoCap > finalTotalCap) {
      return res.status(400).json({ message: "Demo capacity cannot exceed total capacity" });
    }

    if (availableCapacity !== undefined) {
      const availCap = parseInt(availableCapacity);
      if (isNaN(availCap) || availCap < 0 || availCap > finalTotalCap) {
        return res.status(400).json({ message: "Available capacity must be between 0 and total capacity" });
      }
      updateData.availableCapacity = availCap;
    }

    if (availableDemoCapacity !== undefined) {
      const availDemoCap = parseInt(availableDemoCapacity);
      if (isNaN(availDemoCap) || availDemoCap < 0 || availDemoCap > finalDemoCap) {
        return res.status(400).json({ message: "Available demo capacity must be between 0 and demo capacity" });
      }
      updateData.availableDemoCapacity = availDemoCap;
    }

    if (locationId !== undefined && locationId !== existingSchedule.locationId) {
      const location = await Location.findOne({ id: locationId, active: true });
      if (!location) {
        return res.status(400).json({ message: "New location not found or inactive" });
      }
      updateData.locationId = locationId;
    }

    if (sessionId !== undefined && sessionId !== existingSchedule.sessionId) {
      const session = await Session.findOne({ id: sessionId });
      if (!session) {
        return res.status(400).json({ message: "Session not found" });
      }
      updateData.sessionId = sessionId;
    }

    if (programId !== undefined || planId !== undefined) {
      if (programId && planId) {
        return res.status(400).json({ message: "Cannot have both programId and planId" });
      }

      if (programId) {
        const program = await Program.findOne({ id: programId });
        if (!program) {
          return res.status(400).json({ message: "Program not found" });
        }
        updateData.programId = programId;
        updateData.planId = undefined;
      }

      if (planId) {
        const plan = await Plan.findOne({ id: planId });
        if (!plan) {
          return res.status(400).json({ message: "Plan not found" });
        }
        updateData.planId = planId;
        updateData.programId = undefined;
      }
    }

    if (active !== undefined) {
      updateData.active = Boolean(active);
    }

    if (updateData.date || updateData.locationId || updateData.sessionId || 
        updateData.programId !== undefined || updateData.planId !== undefined) {
      
      const checkDate = updateData.date || existingSchedule.date;
      const checkLocationId = updateData.locationId || existingSchedule.locationId;
      const checkSessionId = updateData.sessionId || existingSchedule.sessionId;
      const checkProgramId = updateData.programId !== undefined ? updateData.programId : existingSchedule.programId;
      const checkPlanId = updateData.planId !== undefined ? updateData.planId : existingSchedule.planId;

      const duplicateQuery: any = {
        locationId: checkLocationId,
        sessionId: checkSessionId,
        date: {
          $gte: new Date(new Date(checkDate).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(checkDate).setHours(23, 59, 59, 999))
        },
        id: { $ne: scheduleId }
      };

      if (checkProgramId) duplicateQuery.programId = checkProgramId;
      if (checkPlanId) duplicateQuery.planId = checkPlanId;

      const duplicateSchedule = await Schedule.findOne(duplicateQuery);
      if (duplicateSchedule) {
        return res.status(409).json({ 
          message: "A schedule with the same location, session, date, and program/plan already exists" 
        });
      }
    }

    const updatedSchedule = await Schedule.findOneAndUpdate(
      { id: scheduleId },
      updateData,
      { new: true, runValidators: true }
    ).select("id date totalCapacity demoCapacity availableCapacity availableDemoCapacity locationId sessionId programId planId active");

    res.status(200).json(updatedSchedule);
  } catch (error: any) {
    console.error("Error updating schedule:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "A schedule with this combination already exists" });
    }

    res.status(500).json({
      message: "Failed to update schedule",
      error: error.message,
    });
  }
};

export const deleteSchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const schedule = await Schedule.findOne({ id: scheduleId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (!canManageSchedules(req.user, schedule.locationId)) {
      return res.status(403).json({ message: "Insufficient permissions to delete this schedule" });
    }

    const enrolledCount = schedule.totalCapacity - schedule.availableCapacity;
    const enrolledDemoCount = schedule.demoCapacity - schedule.availableDemoCapacity;
    
    if (enrolledCount > 0 || enrolledDemoCount > 0) {
      return res.status(400).json({
        message: `Cannot delete schedule because it has ${enrolledCount} enrolled students and ${enrolledDemoCount} demo students. Please remove enrollments first.`,
      });
    }

    const deletedSchedule = await Schedule.findOneAndDelete({ id: scheduleId });

    res.status(200).json({
      message: "Schedule deleted successfully",
      deletedSchedule: {
        id: deletedSchedule!.id,
        date: deletedSchedule!.date,
        locationId: deletedSchedule!.locationId
      }
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({
      message: "Failed to delete schedule",
      error: (error as Error).message,
    });
  }
};

export const getSchedulesByDateRange = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Both startDate and endDate are required" });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    let query: any = {
      date: {
        $gte: new Date(start.setHours(0, 0, 0, 0)),
        $lte: new Date(end.setHours(23, 59, 59, 999))
      },
      active: true
    };

    if (!hasGlobalAccess(req.user)) {
      if (!req.user.locationId) {
        return res.status(200).json([]);
      }
      query.locationId = req.user.locationId;
    } else if (locationId) {
      query.locationId = locationId;
    }

    const schedules = await Schedule.find(query)
      .select("id date totalCapacity demoCapacity availableCapacity availableDemoCapacity locationId sessionId programId planId")
      .sort({ date: 1 })
      .lean();

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules by date range:", error);
    res.status(500).json({
      message: "Failed to fetch schedules by date range",
      error: (error as Error).message,
    });
  }
};

export const getSchedulesByLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationId } = req.params;
    const { active, futureOnly } = req.query;

    if (!locationId) {
      return res.status(400).json({ message: "Location ID is required" });
    }

    if (!canAccessLocation(req.user, locationId)) {
      return res.status(403).json({ message: "Access denied for this location" });
    }

    let query: any = { locationId };
    
    if (active !== undefined) {
      query.active = active === 'true';
    }

    if (futureOnly === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    const schedules = await Schedule.find(query)
      .select("id date totalCapacity demoCapacity availableCapacity availableDemoCapacity sessionId programId planId active")
      .sort({ date: 1 })
      .lean();

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules by location:", error);
    res.status(500).json({
      message: "Failed to fetch schedules by location",
      error: (error as Error).message,
    });
  }
};

export const bookScheduleSlot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { isDemo = false } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const schedule = await Schedule.findOne({ id: scheduleId, active: true });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found or inactive" });
    }

    if (!canAccessLocation(req.user, schedule.locationId)) {
      return res.status(403).json({ message: "Access denied for this schedule" });
    }

    const success = schedule.bookSlot(isDemo);
    if (!success) {
      const slotType = isDemo ? 'demo' : 'regular';
      return res.status(400).json({ message: `No available ${slotType} slots` });
    }

    await schedule.save();

    res.status(200).json({
      message: "Slot booked successfully",
      schedule: {
        id: schedule.id,
        availableCapacity: schedule.availableCapacity,
        availableDemoCapacity: schedule.availableDemoCapacity
      }
    });
  } catch (error) {
    console.error("Error booking schedule slot:", error);
    res.status(500).json({
      message: "Failed to book schedule slot",
      error: (error as Error).message,
    });
  }
};

export const cancelScheduleSlot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { isDemo = false } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const schedule = await Schedule.findOne({ id: scheduleId, active: true });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found or inactive" });
    }

    if (!canAccessLocation(req.user, schedule.locationId)) {
      return res.status(403).json({ message: "Access denied for this schedule" });
    }

    const success = schedule.cancelSlot(isDemo);
    if (!success) {
      const slotType = isDemo ? 'demo' : 'regular';
      return res.status(400).json({ message: `Cannot cancel ${slotType} slot - capacity would exceed maximum` });
    }

    await schedule.save();

    res.status(200).json({
      message: "Slot cancelled successfully",
      schedule: {
        id: schedule.id,
        availableCapacity: schedule.availableCapacity,
        availableDemoCapacity: schedule.availableDemoCapacity
      }
    });
  } catch (error) {
    console.error("Error cancelling schedule slot:", error);
    res.status(500).json({
      message: "Failed to cancel schedule slot",
      error: (error as Error).message,
    });
  }
};