import mongoose, { Schema, Document } from 'mongoose';
import { hashPassword, comparePassword, isPasswordHashed } from '../utils/password-utils';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole {
  OWNER = 'owner',
  LOCATION_MANAGER = 'location_manager',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent'
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IAchievement {
  title: string;
  icon: string;
  earnedDate: Date;
}

export interface IClassInfo {
  name: string;
  teacher: string;
  time: string;
  room: string;
}

export interface IProgressData {
  month: string;
  score: number;
  date: Date;
}

export interface ISubjectProgress {
  subject: string;
  score: number;
  lastUpdated: Date;
}

export interface IUser extends Document {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  address?: IAddress;
  role: UserRole;
  dateOfBirth?: Date;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
  students?: string[];
  active: boolean;
  stripeCustomerId?: string;
  paypalPayerId?: string;

  
  locationId?: string;

  
  level?: string;
  progress?: number;
  achievements?: IAchievement[];
  currentClass?: IClassInfo;
  nextClass?: IClassInfo;
  progressData?: IProgressData[];
  subjectProgress?: ISubjectProgress[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zip: { type: String, required: false },
  country: { type: String, required: false }
});

const AchievementSchema = new Schema<IAchievement>({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  earnedDate: { type: Date, default: Date.now }
});

const ClassInfoSchema = new Schema<IClassInfo>({
  name: { type: String, required: true },
  teacher: { type: String, required: true },
  time: { type: String, required: true },
  room: { type: String, required: true }
});

const ProgressDataSchema = new Schema<IProgressData>({
  month: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const SubjectProgressSchema = new Schema<ISubjectProgress>({
  subject: { type: String, required: true },
  score: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, default: () => uuidv4(), required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters long']
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      required: function () { return this.role === UserRole.STUDENT; }
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
      type: String,
      required: false
    },
    students: [{
      type: String,
      required: false
    }],
    active: { type: Boolean, default: true },
    stripeCustomerId: { type: String, required: false },
    paypalPayerId: { type: String, required: false },

    
    locationId: { 
      type: String, 
      required: function() {
        
        return [
          UserRole.LOCATION_MANAGER,
          UserRole.ADMIN,
          UserRole.TEACHER
        ].includes(this.role);
      }
    },

    // Student/Progress specific fields
    level: { type: String, required: false },
    progress: { type: Number, required: false, default: 0 },
    achievements: [AchievementSchema],
    currentClass: { type: ClassInfoSchema, required: false },
    nextClass: { type: ClassInfoSchema, required: false },
    progressData: [ProgressDataSchema],
    subjectProgress: [SubjectProgressSchema]
  },
  { timestamps: true }
);


UserSchema.pre('save', async function (next) {

  if (this.isModified('password')) {
    try {
      if (!isPasswordHashed(this.password)) {
        console.log('Hashing password in pre-save hook');
        this.password = await hashPassword(this.password);
      } else {
        console.log('Password already hashed, skipping hash in pre-save hook');
      }
    } catch (error: any) {
      return next(error);
    }
  }

  if (this.isModified('role') || this.isModified('locationId')) {
    const locationRequiredRoles = [
      UserRole.LOCATION_MANAGER,
      UserRole.ADMIN,
      UserRole.TEACHER
    ];

    const locationOptionalRoles = [
      UserRole.STUDENT,
      UserRole.PARENT
    ];

    const locationForbiddenRoles = [
      UserRole.OWNER
    ];

    if (locationRequiredRoles.includes(this.role)) {
      if (!this.locationId) {
        return next(new Error(`${this.role} role requires a location assignment`));
      }
    } else if (locationForbiddenRoles.includes(this.role)) {
      if (this.locationId) {
        this.locationId = undefined; 
      }
    }
   
  }

  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  console.log("Comparing password for user:", this.email);
  console.log("Candidate password length:", candidatePassword.length);
  console.log("Stored hash length:", this.password.length);
  
  try {
    const result = await comparePassword(candidatePassword, this.password);
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Error comparing password:", error);
    return false;
  }
};

UserSchema.methods.isOwner = function(): boolean {
  return this.role === UserRole.OWNER;
};

UserSchema.methods.isLocationSpecific = function(): boolean {
  return [
    UserRole.LOCATION_MANAGER,
    UserRole.ADMIN,
    UserRole.TEACHER
  ].includes(this.role);
};

UserSchema.methods.canAccessLocation = function(locationId: string): boolean {
  if (this.role === UserRole.OWNER) {
    return true;
  }
  
  if (this.isLocationSpecific()) {
    return this.locationId === locationId;
  }
  
  if ([UserRole.PARENT, UserRole.STUDENT].includes(this.role)) {
    return !this.locationId || this.locationId === locationId;
  }
  
  return false;
};

UserSchema.methods.hasGlobalAccess = function(): boolean {
  return this.role === UserRole.OWNER;
};

// Indexes
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ locationId: 1 });
UserSchema.index({ parentId: 1 });
UserSchema.index({ active: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;