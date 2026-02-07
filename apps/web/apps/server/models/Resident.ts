/**
 * Resident Model
 * 
 * MongoDB schema for registered residents from mobile app.
 * Stores personal info, household data, ID verification, and AI confidence scores.
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export interface IResident extends Document {
  // Personal Info (Step 1)
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  mobileNumber: string;
  password: string;
  
  // Household Info (Step 2)
  city: string;
  barangay: string;
  streetAddress: string;
  householdSize: number;
  vulnerableMembers: string[];
  vulnerableCounts: Record<string, number>;
  
  // Identity Verification (Step 3)
  idType: string;
  idNumber: string;
  frontIdImage: string;
  backIdImage: string;
  
  // Face Scan (Step 4)
  faceImage: string;
  
  // Face Descriptor (128-float array for face recognition - privacy compliant)
  faceDescriptor?: number[];
  faceDescriptorMetadata?: {
    generatedAt: Date;
    modelVersion: string;
    confidence: number;
  };
  
  // AI Verification Results
  verification: {
    overallConfidence: number; // 0-100 percentage
    idConfidence: number;
    faceMatchConfidence: number;
    livenessConfidence: number;
    dataMatchScore: number;
    riskScore: number;
    isVerified: boolean;
    aiVerificationStatus: 'High Match' | 'Medium Match' | 'Low Match';
    warnings: string[];
    riskFactors: string[];
  };
  
  // Application Status
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ResidentSchema: Schema = new Schema(
  {
    // Personal Info
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: String,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: [true, 'Gender is required'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    
    // Household Info
    city: {
      type: String,
      trim: true,
      default: '',
    },
    barangay: {
      type: String,
      required: [true, 'Barangay is required'],
      trim: true,
    },
    streetAddress: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    householdSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    vulnerableMembers: [{
      type: String,
    }],
    vulnerableCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    
    // Identity Verification
    idType: {
      type: String,
      required: [true, 'ID type is required'],
    },
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
    },
    frontIdImage: {
      type: String,
      required: [true, 'Front ID image is required'],
    },
    backIdImage: {
      type: String,
      required: [true, 'Back ID image is required'],
    },
    
    // Face Scan
    faceImage: {
      type: String,
      required: [true, 'Face image is required'],
    },
    
    // Face Descriptor (128-float array for face recognition)
    // This is stored instead of raw images for privacy compliance
    faceDescriptor: {
      type: [Number],
      validate: {
        validator: function(arr: number[]) {
          return !arr || arr.length === 0 || arr.length === 128;
        },
        message: 'Face descriptor must contain exactly 128 values'
      },
      index: true,  // Index for faster duplicate checks
    },
    faceDescriptorMetadata: {
      generatedAt: {
        type: Date,
      },
      modelVersion: {
        type: String,
        default: 'face-api.js-ssd-mobilenetv1'
      },
      confidence: {
        type: Number,
      }
    },
    
    // AI Verification Results
    verification: {
      overallConfidence: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      idConfidence: {
        type: Number,
        default: 0,
      },
      faceMatchConfidence: {
        type: Number,
        default: 0,
      },
      livenessConfidence: {
        type: Number,
        default: 0,
      },
      dataMatchScore: {
        type: Number,
        default: 0,
      },
      riskScore: {
        type: Number,
        default: 0,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      aiVerificationStatus: {
        type: String,
        enum: ['High Match', 'Medium Match', 'Low Match'],
        default: 'Low Match',
      },
      warnings: [{
        type: String,
      }],
      riskFactors: [{
        type: String,
      }],
    },
    
    // Application Status
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
    },
    verifiedBy: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
ResidentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const password = this.password as string;
  
  try {
    if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
      return next();
    }
    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    this.password = hashedPassword;
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
ResidentSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const resident = this as IResident;
  return bcrypt.compare(candidatePassword, resident.password);
};

// Remove password from JSON output
ResidentSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model<IResident>('Resident', ResidentSchema);
