import { Request, Response } from "express";
import User, { UserRole } from "../models/user";

export const addStudent = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phone,
      password,
      parentId
    } = req.body;

    if (!firstName || !lastName || !dateOfBirth || !email || !password) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (req.user?.role !== UserRole.PARENT && req.user?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Only parents or admins can add students" });
    }

    if (parentId && parentId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "You can only add students to your own account" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const newStudent = new User({
      firstName,
      lastName,
      email,
      password,
      phone: phone || null,
      dateOfBirth: new Date(dateOfBirth),
      role: UserRole.STUDENT,
      parentId: parentId || req.user.id,

      // >> Default values for student dashboard
      location: "Main Learning Center",
      level: "Beginner",
      progress: 0,
      achievements: [],
      progressData: [
        { month: "Current", score: 0, date: new Date() }
      ],
      subjectProgress: [
        { subject: "Math", score: 0, lastUpdated: new Date() },
        { subject: "Science", score: 0, lastUpdated: new Date() },
        { subject: "English", score: 0, lastUpdated: new Date() },
        { subject: "History", score: 0, lastUpdated: new Date() }
      ]
    });

    await newStudent.save();

    await User.findByIdAndUpdate(
      parentId || req.user.id,
      { $push: { students: newStudent._id } }
    );

    const studentData = newStudent.toObject();
    delete studentData.password;

    res.status(201).json({
      message: "Student added successfully",
      student: studentData
    });
  } catch (error) {
    console.error("Failed to add student:", error);
    res.status(500).json({ message: "Failed to add student" });
  }
};

export const getStudentsByParent = async (req: Request, res: Response) => {
  try {
    const { parentId } = req.query;

    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== parentId) {
      return res.status(403).json({ message: "You can only view your own students" });
    }

    const students = await User.find({
      parentId: parentId,
      role: UserRole.STUDENT
    }).select('-password');

    res.json(students);
  } catch (error) {
    console.error("Failed to fetch students:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({
      _id: studentId,
      role: UserRole.STUDENT
    }).select('-password');

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (
      req.user?.role !== UserRole.ADMIN &&
      req.user?.id !== student.parentId.toString()
    ) {
      return res.status(403).json({ message: "You can only view your own students" });
    }

    res.json(student);
  } catch (error) {
    console.error("Failed to fetch student:", error);
    res.status(500).json({ message: "Failed to fetch student" });
  }
};