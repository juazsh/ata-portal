import { Request, Response } from "express";
import { DemoRegistration } from "../models/demo-registration";
import mongoose from "mongoose";
import { sendMail } from "../services/email";
import { getDemoRegistrationEmailTemplate } from "../utils/demo-email-templates";


export const createDemoRegistration = async (req: Request, res: Response) => {
  try {
    const demoRegistrationData = req.body;


    const requiredFields = [
      'parentFirstName', 'parentLastName', 'parentEmail', 'parentPhone',
      'studentFirstName', 'studentLastName', 'studentDOB', 'demoClassDate'
    ];

    for (const field of requiredFields) {
      if (!demoRegistrationData[field]) {
        return res.status(400).json({
          message: `Missing required field: ${field}`
        });
      }
    }


    const dob = new Date(demoRegistrationData.studentDOB);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 6 || age > 18) {
      return res.status(400).json({
        message: "Student must be between 6 and 18 years old"
      });
    }


    const demoDate = new Date(demoRegistrationData.demoClassDate);
    if (demoDate <= today) {
      return res.status(400).json({
        message: "Demo class date must be in the future"
      });
    }


    const newDemoRegistration = new DemoRegistration(demoRegistrationData);
    const savedDemoRegistration = await newDemoRegistration.save();


    const emailHtml = getDemoRegistrationEmailTemplate({
      parentFirstName: savedDemoRegistration.parentFirstName,
      parentLastName: savedDemoRegistration.parentLastName,
      studentFirstName: savedDemoRegistration.studentFirstName,
      studentLastName: savedDemoRegistration.studentLastName,
      demoClassDate: savedDemoRegistration.demoClassDate.toISOString(),
      registrationId: savedDemoRegistration._id.toString()
    });

    await sendMail({
      to: savedDemoRegistration.parentEmail,
      subject: 'STEM Masters - Demo Class Registration Confirmation',
      html: emailHtml
    });

    res.status(201).json(savedDemoRegistration);
  } catch (error) {
    console.error("Error creating demo registration:", error);
    res.status(500).json({
      message: "Failed to create demo registration",
      error: (error as Error).message
    });
  }
};


export const getDemoRegistrations = async (req: Request, res: Response) => {
  try {
    const { status, email, date, upcoming } = req.query;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (email) {
      query.parentEmail = email;
    }

    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      query.demoClassDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (upcoming === 'true') {
      query.demoClassDate = { $gte: new Date() };
      query.status = { $ne: 'cancelled' };
    }

    const demoRegistrations = await DemoRegistration.find(query)
      .sort('demoClassDate');

    res.status(200).json({
      count: demoRegistrations.length,
      registrations: demoRegistrations
    });
  } catch (error) {
    console.error("Error fetching demo registrations:", error);
    res.status(500).json({
      message: "Failed to fetch demo registrations",
      error: (error as Error).message
    });
  }
};


export const getDemoRegistrationById = async (req: Request, res: Response) => {
  try {
    const { demoRegistrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(demoRegistrationId)) {
      return res.status(400).json({
        message: "Invalid demo registration ID format"
      });
    }

    const demoRegistration = await DemoRegistration.findById(demoRegistrationId);

    if (!demoRegistration) {
      return res.status(404).json({
        message: "Demo registration not found"
      });
    }

    res.status(200).json(demoRegistration);
  } catch (error) {
    console.error("Error fetching demo registration:", error);
    res.status(500).json({
      message: "Failed to fetch demo registration",
      error: (error as Error).message
    });
  }
};


export const updateDemoRegistration = async (req: Request, res: Response) => {
  try {
    const { demoRegistrationId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(demoRegistrationId)) {
      return res.status(400).json({
        message: "Invalid demo registration ID format"
      });
    }

    if (updateData.demoClassDate) {
      const demoDate = new Date(updateData.demoClassDate);
      if (demoDate <= new Date()) {
        return res.status(400).json({
          message: "Demo class date must be in the future"
        });
      }
    }

    const updatedDemoRegistration = await DemoRegistration.findByIdAndUpdate(
      demoRegistrationId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDemoRegistration) {
      return res.status(404).json({
        message: "Demo registration not found"
      });
    }

    res.status(200).json(updatedDemoRegistration);
  } catch (error) {
    console.error("Error updating demo registration:", error);
    res.status(500).json({
      message: "Failed to update demo registration",
      error: (error as Error).message
    });
  }
};

export const deleteDemoRegistration = async (req: Request, res: Response) => {
  try {
    const { demoRegistrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(demoRegistrationId)) {
      return res.status(400).json({
        message: "Invalid demo registration ID format"
      });
    }

    const deletedDemoRegistration = await DemoRegistration.findByIdAndDelete(demoRegistrationId);

    if (!deletedDemoRegistration) {
      return res.status(404).json({
        message: "Demo registration not found"
      });
    }

    res.status(200).json({
      message: "Demo registration deleted successfully",
      registrationId: deletedDemoRegistration._id
    });
  } catch (error) {
    console.error("Error deleting demo registration:", error);
    res.status(500).json({
      message: "Failed to delete demo registration",
      error: (error as Error).message
    });
  }
};