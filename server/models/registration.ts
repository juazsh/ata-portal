import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRegistration extends Document {

  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;


  studentFirstName: string;
  studentLastName: string;
  studentDOB: Date;


  programId: Types.ObjectId;
  offeringId: Types.ObjectId;
  enrollmentDate: Date;


  paymentMethod: "paypal" | "credit-card";
  firstPaymentAmount: number;
  adminPercent?: number;
  taxPercent?: number;
  totalAmountDue: number;
  discountCode?: string;
  discountPercent?: number;
  paymentStatus?: string;
  paymentProcessor?: string;
  paymentTransactionId?: string;
  paymentDate?: Date;
  nextPaymentDate?: Date;
  autoPayEnabled?: boolean;
  autoPayAmount?: number;


  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  stripePaymentMethodId?: string;


  paypalOrderId?: string;
  paypalSubscriptionId?: string;
  paypalPayerId?: string;


  isRegistrationComplete: boolean;
  isRegLinkedWithEnrollment: boolean;
  isUserSetup: boolean;


  createdAt?: Date;
  updatedAt?: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {

    parentFirstName: { type: String, required: true },
    parentLastName: { type: String, required: true },
    parentEmail: { type: String, required: true },
    parentPhone: { type: String, required: true },


    studentFirstName: { type: String, required: true },
    studentLastName: { type: String, required: true },
    studentDOB: { type: Date, required: true },


    programId: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    enrollmentDate: { type: Date, required: true },


    paymentMethod: {
      type: String,
      enum: ["paypal", "credit-card"],
      required: true
    },
    firstPaymentAmount: { type: Number, required: true },
    adminPercent: { type: Number},
    taxPercent: { type: Number},
    totalAmountDue: { type: Number, required: true },
    discountCode: { type: String },
    discountPercent: { type: Number },
    paymentStatus: { type: String },
    paymentProcessor: { type: String },
    paymentTransactionId: { type: String },
    paymentDate: { type: Date },
    nextPaymentDate: { type: Date },
    autoPayEnabled: { type: Boolean, default: false },
    autoPayAmount: { type: Number },

    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    stripePaymentIntentId: { type: String },
    stripePaymentMethodId: { type: String },

    paypalOrderId: { type: String },
    paypalSubscriptionId: { type: String },
    paypalPayerId: { type: String },

    isRegistrationComplete: { type: Boolean, default: false },
    isRegLinkedWithEnrollment: { type: Boolean, default: false },
    isUserSetup: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

RegistrationSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 432000,
    partialFilterExpression: { isRegistrationComplete: false }
  }
);

export const Registration = mongoose.models.Registration || mongoose.model<IRegistration>("Registration", RegistrationSchema);