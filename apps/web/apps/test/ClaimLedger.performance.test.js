const { expect } = require('chai');
const { ethers } = require('hardhat');

const SESSION_CASE_SIZES = [1, 5, 10];

function buildHouseholdHashes(prefix, count) {
  return Array.from({ length: count }, (_, i) =>
    ethers.keccak256(ethers.toUtf8Bytes(`${prefix}-${i}`))
  );
}

async function txGasUsed(txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return Number(receipt.gasUsed);
}

async function measureSingleClaimSeries(claimLedger, signer, eventHash, households) {
  let totalGas = 0;
  for (const householdHash of households) {
    totalGas += await txGasUsed(
      claimLedger.connect(signer).recordClaim(householdHash, eventHash)
    );
  }

  return {
    totalGas,
    perClaimGas: Math.round(totalGas / households.length),
  };
}

describe('ClaimLedger Performance (Session 1 & Session 2)', function () {
  let owner;
  let attacker;
  let claimLedger;
  let eventHash;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();
    const ClaimLedger = await ethers.getContractFactory('ClaimLedger');
    claimLedger = await ClaimLedger.deploy();
    await claimLedger.waitForDeployment();
    eventHash = ethers.keccak256(ethers.toUtf8Bytes('RELIEF-DROP-2026'));
  });

  it('Session 1: profile recordClaim bottleneck with 3 input sizes', async function () {
    const rows = [];

    for (const size of SESSION_CASE_SIZES) {
      const households = buildHouseholdHashes(`S1-SINGLE-${size}`, size);
      const stats = await measureSingleClaimSeries(
        claimLedger,
        owner,
        eventHash,
        households
      );

      rows.push({
        testCase: `${size} claim(s) using recordClaim`,
        totalGas: stats.totalGas,
        gasPerClaim: stats.perClaimGas,
      });
    }

    console.log('\n[Session 1] Baseline recordClaim gas profile');
    console.table(rows);

    expect(rows).to.have.length(3);
    expect(rows[2].totalGas).to.be.greaterThan(rows[1].totalGas);
    expect(rows[1].totalGas).to.be.greaterThan(rows[0].totalGas);
    expect(rows[0].gasPerClaim).to.be.greaterThan(40000);
  });

  it('Session 2: optimize throughput with recordClaimsBatch', async function () {
    const rows = [];

    for (const size of SESSION_CASE_SIZES) {
      const baselineHouseholds = buildHouseholdHashes(`S2-SINGLE-${size}`, size);
      const baseline = await measureSingleClaimSeries(
        claimLedger,
        owner,
        eventHash,
        baselineHouseholds
      );

      const batchHouseholds = buildHouseholdHashes(`S2-BATCH-${size}`, size);
      const batchGas = await txGasUsed(
        claimLedger.connect(owner).recordClaimsBatch(batchHouseholds, eventHash)
      );
      const batchPerClaim = Math.round(batchGas / size);
      const improvementPct = Number(
        (((baseline.perClaimGas - batchPerClaim) / baseline.perClaimGas) * 100).toFixed(2)
      );

      rows.push({
        testCase: `${size} claim(s)`,
        baselinePerClaimGas: baseline.perClaimGas,
        batchPerClaimGas: batchPerClaim,
        improvementPct,
      });

      if (size > 1) {
        expect(batchPerClaim).to.be.lessThan(baseline.perClaimGas);
      } else {
        expect(batchPerClaim).to.be.greaterThan(0);
      }
    }

    console.log('\n[Session 2] Optimized batch-vs-single comparison');
    console.table(rows);
  });

  it('Batch function keeps access-control and duplicate-claim protections', async function () {
    const firstBatch = buildHouseholdHashes('SEC-BATCH-1', 3);
    const secondBatch = [firstBatch[0], ...buildHouseholdHashes('SEC-BATCH-2', 2)];

    await expect(
      claimLedger.connect(attacker).recordClaimsBatch(firstBatch, eventHash)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    await claimLedger.connect(owner).recordClaimsBatch(firstBatch, eventHash);

    await expect(
      claimLedger.connect(owner).recordClaimsBatch(secondBatch, eventHash)
    ).to.be.revertedWith('ClaimLedger: already claimed');
  });
});
