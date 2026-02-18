import mongoose, { Document, Schema } from 'mongoose';

export type QrScanResult = 'VALID' | 'INVALID' | 'NOT_FOUND';

export interface IResidentQrScanLog extends Document {
  residentId: mongoose.Types.ObjectId | null;
  residentCode: string | null;
  scannerId: string | null;
  scannerRole: string;
  result: QrScanResult;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentQrScanLogSchema = new Schema<IResidentQrScanLog>(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      default: null,
      index: true,
    },
    residentCode: {
      type: String,
      default: null,
      index: true,
    },
    scannerId: {
      type: String,
      default: null,
      index: true,
    },
    scannerRole: {
      type: String,
      required: true,
      default: 'Unknown',
      index: true,
    },
    result: {
      type: String,
      enum: ['VALID', 'INVALID', 'NOT_FOUND'],
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ResidentQrScanLogSchema.index({ createdAt: -1 });
ResidentQrScanLogSchema.index({ residentCode: 1, createdAt: -1 });

const ResidentQrScanLog = mongoose.model<IResidentQrScanLog>('ResidentQrScanLog', ResidentQrScanLogSchema);

export default ResidentQrScanLog;
