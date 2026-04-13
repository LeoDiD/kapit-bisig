import mongoose, { Document, Schema } from 'mongoose';
import { BARANGAY_OPTIONS } from './Distribution';

export const DISASTER_TYPE_OPTIONS = [
  'Typhoon',
  'Flood',
  'Storm Surge',
  'Landslide',
  'Earthquake',
  'Fire',
  'Other',
] as const;

export type DisasterType = typeof DISASTER_TYPE_OPTIONS[number];
export type DisasterEventStatus = 'Draft' | 'Active' | 'Closed';

export interface IDisasterEvent extends Document {
  name: string;
  disasterType: DisasterType;
  description: string;
  barangays: string[];
  eventDate: Date;
  submissionDeadline: Date | null;
  status: DisasterEventStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisasterEventSchema = new Schema<IDisasterEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    disasterType: {
      type: String,
      required: true,
      enum: DISASTER_TYPE_OPTIONS,
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    barangays: {
      type: [String],
      enum: BARANGAY_OPTIONS as unknown as string[],
      required: true,
      default: [],
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: 'At least one barangay is required',
      },
      index: true,
    },
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    submissionDeadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Closed'],
      default: 'Draft',
      index: true,
    },
    createdBy: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

DisasterEventSchema.index({ status: 1, eventDate: -1 });
DisasterEventSchema.index({ barangays: 1, status: 1, eventDate: -1 });

DisasterEventSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    ret.id = String(ret._id);
    delete ret.__v;
    return ret;
  },
});

const DisasterEvent = mongoose.model<IDisasterEvent>('DisasterEvent', DisasterEventSchema);

export default DisasterEvent;
