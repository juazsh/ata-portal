import { Request, Response } from "express";
import User, { UserRole } from "../models/user";
import Enrollment from "../models/enrollment";
import mongoose from 'mongoose';
import { getStudentProgress } from "./students-progress";

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

    const userParentId = parentId || req.user.id;

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
      parentId: userParentId,

      // Default values for student dashboard
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
      userParentId,
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
    const queryParentId = parentId || req.user?.id;

    if (req.user?.role !== UserRole.ADMIN && req.user?.id !== queryParentId) {
      return res.status(403).json({ message: "You can only view your own students" });
    }
    const students = await User.find({
      parentId: queryParentId,
      role: UserRole.STUDENT
    }).select('-password');
    const studentsWithEnrollmentAndProgress = await Promise.all(
      students.map(async (student) => {
        try {
          const enrollments = await Enrollment.find({ studentId: student._id })
            .populate('programId', 'name');
          const progressData = await getStudentProgress(student._id);
          let overallProgress = 0;
          if (progressData?.programs?.length > 0) {
            const totalProgress = progressData.programs.reduce((acc, prog) => acc + prog.completionPercentage, 0);
            overallProgress = Math.round(totalProgress / progressData.programs.length);
          }

          return {
            ...student.toObject(),
            enrolledProgram: enrollments[0]?.programId?.name || "Not enrolled",
            enrollments: enrollments,
            progress: overallProgress
          };
        } catch (err) {
          console.error(`Error fetching details for student ${student._id}:`, err);
          return {
            ...student.toObject(),
            enrolledProgram: "Error loading",
            enrollments: [],
            progress: 0
          };
        }
      })
    );

    res.json(studentsWithEnrollmentAndProgress);
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
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const students = await User.find({
      role: UserRole.STUDENT
    }).select('-password');
    res.status(200).json(students);
  } catch (error) {
    console.error("Failed to fetch all students:", error);
    res.status(500).json({ message: "Failed to fetch all students" });
  }
};

export const getStudentsByProgram = async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ message: "Invalid program ID format" });
    }

    const enrollments = await Enrollment.find({ programId: programId })
      .select('studentId');

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json([]);
    }

    const studentIds = [...new Set(enrollments.map(e => e.studentId))];
    const students = await User.find({
      _id: { $in: studentIds },
      role: UserRole.STUDENT
    }).select('-password');

    res.status(200).json(students);
  } catch (error) {
    console.error(`Failed to fetch students for program ${req.params.programId}:`, error);
    res.status(500).json({ message: "Failed to fetch students by program" });
  }
};