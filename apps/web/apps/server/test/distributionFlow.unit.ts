import assert from 'assert';
import { createDistributionBody } from '../validation/distribution.schema';
import {
  deriveDistributionStatus,
  getTargetBarangays,
  isResidentEligibleForDistribution,
} from '../services/distributionFlowService';
import {
  deriveDistributionLifecycle,
  isDistributionClaimable,
  isDistributionVisibleToResidents,
  legacyDistributionEnd,
} from '../utils/distributionLifecycle';

const validStaffId = '507f1f77bcf86cd799439011';
const validDisasterEventId = '507f1f77bcf86cd799439012';

function nextManilaWindow(): { scheduled: string; endsAt: string } {
  const manilaNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const year = manilaNow.getUTCFullYear();
  const month = manilaNow.getUTCMonth();
  const day = manilaNow.getUTCDate() + 1;

  return {
    scheduled: new Date(Date.UTC(year, month, day, 1, 0, 0)).toISOString(),
    endsAt: new Date(Date.UTC(year, month, day, 3, 0, 0)).toISOString(),
  };
}

const validWindow = nextManilaWindow();

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
    disasterEventId: validDisasterEventId,
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon', 'Dulig', 'San Jose'],
    scheduled: validWindow.scheduled,
    endsAt: validWindow.endsAt,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(validCreate.success, true);

  const minAssigned = createDistributionBody.safeParse({
    disasterEventId: validDisasterEventId,
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon', 'Dulig'],
    scheduled: validWindow.scheduled,
    endsAt: validWindow.endsAt,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(minAssigned.success, true);

  const tooFewAssigned = createDistributionBody.safeParse({
    disasterEventId: validDisasterEventId,
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon'],
    scheduled: validWindow.scheduled,
    endsAt: validWindow.endsAt,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(tooFewAssigned.success, false);

  const includesHost = createDistributionBody.safeParse({
    disasterEventId: validDisasterEventId,
    barangay: 'Bolo',
    assignedBarangays: ['Bolo', 'Dulig', 'San Jose'],
    scheduled: validWindow.scheduled,
    endsAt: validWindow.endsAt,
    assignedStaffIds: [validStaffId],
    notes: 'test',
  });
  assert.strictEqual(includesHost.success, false);

  const manilaNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const eightPmStart = new Date(Date.UTC(
    manilaNow.getUTCFullYear(),
    manilaNow.getUTCMonth(),
    manilaNow.getUTCDate() + 1,
    12,
    0,
    0,
  ));
  const impossibleClosingWindow = createDistributionBody.safeParse({
    disasterEventId: validDisasterEventId,
    barangay: 'Bolo',
    assignedBarangays: ['Bongalon', 'Dulig'],
    scheduled: eightPmStart.toISOString(),
    endsAt: new Date(eightPmStart.getTime() + 60 * 1000).toISOString(),
    assignedStaffIds: [validStaffId],
    notes: 'invalid closing window',
  });
  assert.strictEqual(impossibleClosingWindow.success, false);

  const now = new Date('2026-08-11T02:00:00.000Z');
  const active = {
    scheduled: new Date('2026-08-11T01:00:00.000Z'),
    endsAt: new Date('2026-08-11T03:00:00.000Z'),
    archivedAt: null,
  };
  const upcoming = {
    scheduled: new Date('2026-08-11T04:00:00.000Z'),
    endsAt: new Date('2026-08-11T06:00:00.000Z'),
    archivedAt: null,
  };
  const completed = {
    scheduled: new Date('2026-08-10T01:00:00.000Z'),
    endsAt: new Date('2026-08-10T03:00:00.000Z'),
    archivedAt: null,
  };

  assert.strictEqual(deriveDistributionLifecycle(active, now), 'Active');
  assert.strictEqual(
    deriveDistributionLifecycle(active, new Date('2026-08-11T03:00:00.000Z')),
    'Active',
  );
  assert.strictEqual(deriveDistributionLifecycle(upcoming, now), 'Upcoming');
  assert.strictEqual(deriveDistributionLifecycle(completed, now), 'Completed');
  assert.strictEqual(
    deriveDistributionLifecycle({ ...active, archivedAt: new Date() }, now),
    'Archived',
  );
  assert.strictEqual(isDistributionClaimable(active, now), true);
  assert.strictEqual(isDistributionClaimable(upcoming, now), false);
  assert.strictEqual(isDistributionVisibleToResidents(completed, now), false);
  assert.strictEqual(isDistributionVisibleToResidents(active, now), true);
  assert.strictEqual(
    legacyDistributionEnd(new Date('2026-08-11T01:00:00.000Z')).toISOString(),
    '2026-08-11T12:00:00.000Z',
  );
}
