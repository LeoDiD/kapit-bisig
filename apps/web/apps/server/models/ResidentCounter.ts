import mongoose, { Document, Schema } from 'mongoose';

export interface IResidentCounter extends Document {
  key: string;
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentCounterSchema = new Schema<IResidentCounter>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export async function getNextResidentSequence(key: string): Promise<number> {
  const result = await ResidentCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return result.seq;
}

const ResidentCounter = mongoose.model<IResidentCounter>('ResidentCounter', ResidentCounterSchema);

export default ResidentCounter;
