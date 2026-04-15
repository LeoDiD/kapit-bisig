import assert from 'assert';
import { createDistributionBody } from '../validation/distribution.schema';
import {
  deriveDistributionStatus,
  getTargetBarangays,
  isResidentEligibleForDistribution,
} from '../services/distributionFlowService';

const validStaffId = '507f1f77bcf86cd799439011';
const validSchedule = new Date(Date.now() + 10 * 60 * 1000).toISOString();

export function runDistributionFlowUnitTests(): void {
  const target = getTargetBarangays('Bolo', ['Bongalon', 'Dulig', 'San Jose', 'Bolo']);
  assert.deepStrictEqual(target, ['Bolo', 'Bongalon', 'Dulig', 'San Jose']);

  const eligible = isResidentEligibleForDistribution('Dulig', {
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon', 'Dulig', 'San Jose'],
  } as any);
  assert.strictEqual(eligible, true);

  const notEligible = isResidentEligibleForDistribution('Uyong', {
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon', 'Dulig', 'San Jose'],
  } as any);
  assert.strictEqual(notEligible, false);

  assert.strictEqual(deriveDistributionStatus(10, 0), 'Unclaimed');
  assert.strictEqual(deriveDistributionStatus(10, 3), 'Partially Claimed');
  assert.strictEqual(deriveDistributionStatus(10, 10), 'Claimed');

  const validCreate = createDistributionBody.safeParse({
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon', 'Dulig', 'San Jose'],
    scheduled: validSchedule,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(validCreate.success, true);

  const minAssigned = createDistributionBody.safeParse({
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon', 'Dulig'],
    scheduled: validSchedule,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(minAssigned.success, true);

  const tooFewAssigned = createDistributionBody.safeParse({
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon'],
    scheduled: validSchedule,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(tooFewAssigned.success, false);

  const includesHost = createDistributionBody.safeParse({
    barangay: 'Bolo',
    assignedBarangays: ['Bolo', 'Dulig', 'San Jose'],
    scheduled: validSchedule,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(includesHost.success, false);
}
