import assert from 'assert';
import { createDistributionBody } from '../validation/distribution.schema';
import {
  deriveDistributionStatus,
  getTargetBarangays,
  isResidentEligibleForDistribution,
} from '../services/distributionFlowService';

const validStaffId = '507f1f77bcf86cd799439011';
const validDisasterEventId = '507f1f77bcf86cd799439012';
const validSchedule = new Date(Date.now() + 10 * 60 * 1000).toISOString();

export function runDistributionFlowUnitTests(): void {
  // Single barangay target
  const targetSingle = getTargetBarangays('Bolo');
  assert.deepStrictEqual(targetSingle, ['Bolo']);

  const targetWithAssigned = getTargetBarangays('Bolo', ['Bongalon', 'Dulig', 'San Jose']);
  assert.deepStrictEqual(targetWithAssigned, ['Bolo', 'Bongalon', 'Dulig', 'San Jose']);

  const eligible = isResidentEligibleForDistribution('Bolo', {
    barangay: 'Bolo',
    assignedBarangays: [],
  } as any);
  assert.strictEqual(eligible, true);

  const notEligible = isResidentEligibleForDistribution('Uyong', {
    barangay: 'Bolo',
    assignedBarangays: [],
  } as any);
  assert.strictEqual(notEligible, false);

  assert.strictEqual(deriveDistributionStatus(10, 0), 'Unclaimed');
  assert.strictEqual(deriveDistributionStatus(10, 3), 'Partially Claimed');
  assert.strictEqual(deriveDistributionStatus(10, 10), 'Claimed');

  // Valid create without assignedBarangays (new 3-step per-barangay flow)
  const validCreateSingle = createDistributionBody.safeParse({
    disasterEventId: validDisasterEventId,
    barangay: 'Bolo',
    scheduled: validSchedule,
    assignedStaffIds: [validStaffId],
    notes: 'Single barangay distribution',
  });
  assert.strictEqual(validCreateSingle.success, true);

  // Valid create with empty array
  const validCreateEmptyAssigned = createDistributionBody.safeParse({
    disasterEventId: validDisasterEventId,
    barangay: 'Bolo',
    assignedBarangays: [],
    scheduled: validSchedule,
    assignedStaffIds: [validStaffId],
    notes: 'Empty assigned array',
  });
  assert.strictEqual(validCreateEmptyAssigned.success, true);

  // Valid create without disasterEventId
  const validCreateWithoutEvent = createDistributionBody.safeParse({
    barangay: 'Bolo',
    scheduled: validSchedule,
    assignedStaffIds: [validStaffId],
    notes: 'Single barangay distribution without event',
  });
  assert.strictEqual(validCreateWithoutEvent.success, true);

  // Invalid: missing assigned staff
  const missingStaff = createDistributionBody.safeParse({
    barangay: 'Bolo',
    scheduled: validSchedule,
    assignedStaffIds: [],
    notes: 'test',
  });
  assert.strictEqual(missingStaff.success, false);
}
