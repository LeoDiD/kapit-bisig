const { expect } = require('chai');
const { ethers } = require('hardhat');

function shortHash(value) {
  if (!value) return '(none)';
  if (value.length <= 14) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

describe('ClaimLedger Security (Risk #5)', function () {
  let owner;
  let attacker;
  let claimLedger;
  let claimLedgerAddress;
  let householdHash;
  let eventHashA;
  let eventHashB;

  beforeEach(async function () {
    console.log('\n--------------------------------------------------------------------------------');
    console.log('[Setup] Preparing clean on-chain test state');
    [owner, attacker] = await ethers.getSigners();
    console.log(`[Setup] Owner signer:    ${owner.address}`);
    console.log(`[Setup] Attacker signer: ${attacker.address}`);

    const ClaimLedger = await ethers.getContractFactory('ClaimLedger');
    claimLedger = await ClaimLedger.deploy();
    await claimLedger.waitForDeployment();
    claimLedgerAddress = await claimLedger.getAddress();
    console.log(`[Setup] Deployed ClaimLedger at: ${claimLedgerAddress}`);

    householdHash = ethers.keccak256(ethers.toUtf8Bytes('HOUSEHOLD-A'));
    eventHashA = ethers.keccak256(ethers.toUtf8Bytes('EVENT-A'));
    eventHashB = ethers.keccak256(ethers.toUtf8Bytes('EVENT-B'));

    console.log(`[Setup] householdHash: ${shortHash(householdHash)}`);
    console.log(`[Setup] eventHashA:    ${shortHash(eventHashA)}`);
    console.log(`[Setup] eventHashB:    ${shortHash(eventHashB)}`);
  });

  it('Normal Case: owner records one valid household hash claim', async function () {
    console.log('\n[Normal] Step 1: owner submits first claim');
    const tx = await claimLedger.connect(owner).recordClaim(householdHash, eventHashA);
    console.log(`[Normal] Submitted tx hash: ${shortHash(tx.hash)}`);

    console.log('[Normal] Step 2: wait for confirmation');
    const receipt = await tx.wait();
    console.log(`[Normal] Confirmed in block: ${receipt.blockNumber}`);

    console.log('[Normal] Step 3: verify event emission');
    const parsedLogs = receipt.logs
      .filter((log) => log.address.toLowerCase() === claimLedgerAddress.toLowerCase())
      .map((log) => {
        try {
          return claimLedger.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const hasClaimRecorded = parsedLogs.some((log) => log.name === 'ClaimRecorded');
    expect(hasClaimRecorded).to.equal(true);
    console.log('[Normal] Event check passed (ClaimRecorded emitted)');

    console.log('[Normal] Step 4: verify claimed state = true');
    const isClaimed = await claimLedger.isClaimed(householdHash);
    console.log(`[Normal] isClaimed(householdHash) => ${isClaimed}`);
    expect(isClaimed).to.equal(true);
    console.log('[Normal] Result: PASS');
  });

  it('Attacked Case: non-owner is blocked from unauthorized submission', async function () {
    console.log('\n[Attack] Step 1: attacker submits unauthorized claim');
    const txPromise = claimLedger.connect(attacker).recordClaim(householdHash, eventHashA);

    console.log('[Attack] Step 2: verify revert reason');
    await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner');
    console.log('[Attack] Revert check passed (onlyOwner guard active)');

    console.log('[Attack] Step 3: verify state remains unchanged');
    const isClaimed = await claimLedger.isClaimed(householdHash);
    console.log(`[Attack] isClaimed(householdHash) => ${isClaimed}`);
    expect(isClaimed).to.equal(false);
    console.log('[Attack] Result: PASS');
  });

  it('Edge Case: duplicate household hash is rejected even with different event hash', async function () {
    console.log('\n[Edge] Step 1: owner records initial claim');
    const tx1 = await claimLedger.connect(owner).recordClaim(householdHash, eventHashA);
    await tx1.wait();
    console.log(`[Edge] First claim tx hash: ${shortHash(tx1.hash)}`);

    console.log('[Edge] Step 2: owner retries with same householdHash + different eventHash');
    const txPromise = claimLedger.connect(owner).recordClaim(householdHash, eventHashB);

    console.log('[Edge] Step 3: verify duplicate protection revert reason');
    await expect(txPromise).to.be.revertedWith('ClaimLedger: already claimed');
    console.log('[Edge] Revert check passed (one-claim-per-householdHash enforced)');

    console.log('[Edge] Step 4: verify household remains claimed = true');
    const isClaimed = await claimLedger.isClaimed(householdHash);
    console.log(`[Edge] isClaimed(householdHash) => ${isClaimed}`);
    expect(isClaimed).to.equal(true);
    console.log('[Edge] Result: PASS');
  });
});
