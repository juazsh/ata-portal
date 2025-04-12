// models/user.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  PARENT = 'parent',
  STUDENT = 'student',
  TEACHER = 'teacher'
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address?: IAddress;
  role: UserRole;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
  parentId?: mongoose.Types.ObjectId; // Reference to parent (for student accounts)
  students?: mongoose.Types.ObjectId[]; // References to students (for parent accounts)
  active: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zip: { type: String, required: false },
  country: { type: String, required: false }
});

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters long']
    },
    phone: { type: String, required: false },
    address: { type: AddressSchema, required: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PARENT
    },
    dateOfBirth: { type: Date, required: false },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    students: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create the model or get it if it already exists
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;