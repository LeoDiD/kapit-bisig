import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import Distribution from '../models/Distribution';
import { legacyDistributionEnd } from '../utils/distributionLifecycle';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kapit-bisig';

async function main(): Promise<void> {
  await mongoose.connect(MONGODB_URI);

  try {
    const records = await Distribution.find({ endsAt: null }).select('_id scheduled createdAt');
    let invalid = 0;
    const invalidIds: string[] = [];

    for (const record of records) {
      const parsedStart = new Date(record.scheduled);
      const isValid = !Number.isNaN(parsedStart.getTime());
      if (!isValid) {
        invalid += 1;
        invalidIds.push(record._id.toString());
      }

      record.endsAt = legacyDistributionEnd(
        isValid ? parsedStart : null,
        new Date(0),
      );
      await record.save({ validateModifiedOnly: true });
    }

    console.log(`Backfilled ${records.length} distributions; ${invalid} invalid schedules were expired for review.`);
    if (invalidIds.length > 0) {
      console.warn(`Admin review required for distribution IDs: ${invalidIds.join(', ')}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

void main().catch((error) => {
  console.error('Distribution end-time backfill failed:', error);
  process.exitCode = 1;
});
