import { Request, Response } from 'express';
import { Session, DayOfWeek } from '../models/sessions';

export const createSession = async (req: Request, res: Response) => {
  try {
    const sessionData = req.body;
    const session = new Session(sessionData);
    console.log(session);
    const createdSession = await session.save();
    res.status(201).json(createdSession);
  } catch (error: any) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Failed to create session" });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(session);
  } catch (error: any) {
    console.error("Error fetching session:", error);
    res.status(500).json({ message: "Failed to fetch session" });
  }
};

export const updateSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessionData = req.body;
    const updatedSession = await Session.findByIdAndUpdate(id, sessionData, { new: true });
    if (!updatedSession) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(updatedSession);
  } catch (error: any) {
    console.error("Error updating session:", error);
    res.status(500).json({ message: "Failed to update session" });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedSession = await Session.findByIdAndDelete(id);
    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    console.error("Error removing session:", error);
    res.status(500).json({ message: "Failed to remove session" });
  }
}; 