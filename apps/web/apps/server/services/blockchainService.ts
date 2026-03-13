/**
 * Blockchain Service
 *
 * Sepolia-only runtime for reading/writing ClaimLedger.
 * - Writer: backend signer from PRIVATE_KEY
 * - RPC: RPC_URL
 * - Contract address: CONTRACT_ADDRESS
 */

import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

interface ContractArtifact {
  abi: ethers.InterfaceAbi;
}

export function getChainId(): number {
  return env.CHAIN_ID;
}

export function getConfirmationsRequired(): number {
  const n = env.CONFIRMATIONS_REQUIRED;
  if (n < 1) {
    throw new Error('CONFIRMATIONS_REQUIRED must be >= 1');
  }
  return n;
}

export function getContractAddress(): string {
  try {
    return ethers.getAddress(env.CONTRACT_ADDRESS);
  } catch {
    throw new Error(
      `Invalid CONTRACT_ADDRESS "${env.CONTRACT_ADDRESS}". Expected 0x + 40 hex characters.`,
    );
  }
}

function loadArtifact(): ContractArtifact {
  const artifactPath = path.join(
    __dirname,
    '..',
    '..',
    'artifacts',
    'contracts',
    'ClaimLedger.sol',
    'ClaimLedger.json',
  );
  if (fs.existsSync(artifactPath)) {
    const raw = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    if (raw?.abi) {
      return { abi: raw.abi };
    }
  }

  const runtimeJsonPath = path.join(__dirname, '..', 'blockchain', 'ClaimLedger.json');
  if (fs.existsSync(runtimeJsonPath)) {
    const raw = JSON.parse(fs.readFileSync(runtimeJsonPath, 'utf8'));
    if (raw?.abi) {
      return { abi: raw.abi };
    }
  }

  throw new Error(
    'ClaimLedger ABI not found. Run `npx hardhat compile` and deploy script first.',
  );
}

let _provider: ethers.JsonRpcProvider | null = null;
let _signer: ethers.Wallet | null = null;
let _contract: ethers.Contract | null = null;
let _startupValidated = false;
let _batchSupportValidated = false;
let _batchSupported = false;
let _batchSupportValidatedForAddress: string | null = null;
type ClaimCheckMode = 'eventScoped' | 'legacy' | 'none';
let _claimCheckModeValidated = false;
let _claimCheckMode: ClaimCheckMode = 'none';
let _claimCheckModeValidatedForAddress: string | null = null;
const eventScopedIsClaimedInterface = new ethers.Interface([
  'function isClaimed(bytes32 householdHash, bytes32 eventHash) view returns (bool)',
]);
const legacyIsClaimedInterface = new ethers.Interface([
  'function isClaimed(bytes32 householdHash) view returns (bool)',
]);

function isMissingFunctionCallError(err: any): boolean {
  return err?.code === 'CALL_EXCEPTION' && (!err?.data || err?.data === '0x');
}

async function detectClaimCheckMode(): Promise<ClaimCheckMode> {
  const contractAddress = getContractAddress();
  if (_claimCheckModeValidatedForAddress !== contractAddress) {
    _claimCheckModeValidated = false;
    _claimCheckMode = 'none';
    _claimCheckModeValidatedForAddress = contractAddress;
  }

  if (_claimCheckModeValidated) {
    return _claimCheckMode;
  }

  const provider = getProvider();
  const to = contractAddress;

  try {
    try {
      const probeData = eventScopedIsClaimedInterface.encodeFunctionData('isClaimed', [
        ethers.ZeroHash,
        ethers.ZeroHash,
      ]);
      const raw = await provider.call({ to, data: probeData });
      if (raw && raw !== '0x') {
        eventScopedIsClaimedInterface.decodeFunctionResult('isClaimed', raw);
        _claimCheckMode = 'eventScoped';
        return _claimCheckMode;
      }
    } catch (err: any) {
      if (!isMissingFunctionCallError(err)) {
        throw err;
      }
    }

    try {
      const probeData = legacyIsClaimedInterface.encodeFunctionData('isClaimed', [ethers.ZeroHash]);
      const raw = await provider.call({ to, data: probeData });
      if (raw && raw !== '0x') {
        legacyIsClaimedInterface.decodeFunctionResult('isClaimed', raw);
        _claimCheckMode = 'legacy';
        return _claimCheckMode;
      }
    } catch (err: any) {
      if (!isMissingFunctionCallError(err)) {
        throw err;
      }
    }

    _claimCheckMode = 'none';
    return _claimCheckMode;
  } finally {
    _claimCheckModeValidated = true;
  }
}

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(env.RPC_URL);
  }
  return _provider;
}

function getSigner(): ethers.Wallet {
  if (!_signer) {
    _signer = new ethers.Wallet(env.PRIVATE_KEY, getProvider());
  }
  return _signer;
}

function getContract(): ethers.Contract {
  if (!_contract) {
    const { abi } = loadArtifact();
    _contract = new ethers.Contract(getContractAddress(), abi, getSigner());
  }
  return _contract;
}

async function assertChainIdOrThrow(): Promise<void> {
  const provider = getProvider();
  const network = await provider.getNetwork();
  const actual = Number(network.chainId);
  const expected = getChainId();
  if (actual !== expected) {
    throw new Error(
      `RPC chain mismatch: expected chainId=${expected}, got chainId=${actual}. Check RPC_URL/CHAIN_ID.`,
    );
  }
}

async function assertContractDeployedOrThrow(): Promise<void> {
  const code = await getProvider().getCode(getContractAddress());
  if (!code || code === '0x') {
    throw new Error(
      `No contract bytecode found at CONTRACT_ADDRESS=${getContractAddress()} on configured chain.`,
    );
  }
}

async function assertOwnerMatchesSignerOrThrow(): Promise<void> {
  const contract = getContract();
  const hasOwnerFn =
    typeof contract.interface.hasFunction === 'function' &&
    contract.interface.hasFunction('owner()');

  // Some legacy deployments may not expose owner(); skip strict owner check in that case.
  if (!hasOwnerFn) return;

  const signer = getSigner();
  const signerAddress = (await signer.getAddress()).toLowerCase();
  const owner = String(await contract.owner()).toLowerCase();

  if (owner !== signerAddress) {
    throw new Error(
      `Contract owner mismatch: owner=${owner}, signer=${signerAddress}. Set PRIVATE_KEY to the owner key.`,
    );
  }
}

/**
 * Fail-fast startup validation:
 * - correct Sepolia chain
 * - contract exists at CONTRACT_ADDRESS
 * - owner matches signer (when owner() exists)
 */
export async function assertBlockchainReady(): Promise<void> {
  if (_startupValidated) return;

  await assertChainIdOrThrow();
  await assertContractDeployedOrThrow();
  await assertOwnerMatchesSignerOrThrow();
  _startupValidated = true;
}

export interface SubmittedClaimTx {
  txHash: string;
  chainId: number;
  contractAddress: string;
  staffSigner: string;
}

/**
 * Submit claim tx and return immediately after tx hash is available.
 * No confirmation waiting here (non-blocking mode).
 */
export async function submitClaimOnChain(
  householdHash: string,
  eventHash: string,
): Promise<SubmittedClaimTx> {
  const contract = getContract();
  const signer = getSigner();
  const tx = await contract.recordClaim(householdHash, eventHash);

  if (!tx?.hash) {
    throw new Error('Transaction submission failed: missing tx hash');
  }

  return {
    txHash: tx.hash,
    chainId: getChainId(),
    contractAddress: getContractAddress(),
    staffSigner: await signer.getAddress(),
  };
}

/**
 * Submit multiple household hashes in one transaction via recordClaimsBatch.
 * Falls back to single-write path if only one household hash is provided.
 */
export async function submitClaimsBatchOnChain(
  householdHashes: string[],
  eventHash: string,
): Promise<SubmittedClaimTx> {
  if (!Array.isArray(householdHashes) || householdHashes.length === 0) {
    throw new Error('Batch submission requires at least one household hash');
  }

  if (householdHashes.length === 1) {
    return submitClaimOnChain(householdHashes[0], eventHash);
  }

  const contractAddress = getContractAddress();
  if (_batchSupportValidatedForAddress !== contractAddress) {
    _batchSupportValidated = false;
    _batchSupported = false;
    _batchSupportValidatedForAddress = contractAddress;
  }

  if (!_batchSupportValidated) {
    const contract = getContract();
    const signerAddress = await getSigner().getAddress();
    const probeData = contract.interface.encodeFunctionData('recordClaimsBatch', [
      [],
      ethers.ZeroHash,
    ]);

    try {
      await getProvider().call({
        to: getContractAddress(),
        from: signerAddress,
        data: probeData,
      });
      _batchSupported = true;
    } catch (err: any) {
      const isMissingFunction =
        err?.code === 'CALL_EXCEPTION' &&
        (!err?.data || err?.data === '0x');

      if (isMissingFunction) {
        _batchSupported = false;
      } else {
        throw err;
      }
    } finally {
      _batchSupportValidated = true;
    }
  }

  if (!_batchSupported) {
    throw new Error(
      `Deployed contract at ${contractAddress} (chainId=${getChainId()}) does not support recordClaimsBatch. Redeploy latest ClaimLedger and update CONTRACT_ADDRESS.`,
    );
  }

  const contract = getContract();
  const signer = getSigner();
  const tx = await contract.recordClaimsBatch(householdHashes, eventHash);

  if (!tx?.hash) {
    throw new Error('Batch transaction submission failed: missing tx hash');
  }

  return {
    txHash: tx.hash,
    chainId: getChainId(),
    contractAddress: getContractAddress(),
    staffSigner: await signer.getAddress(),
  };
}

export async function isClaimedOnChain(
  householdHash: string,
  eventHash: string,
): Promise<boolean> {
  const provider = getProvider();
  const to = getContractAddress();
  const mode = await detectClaimCheckMode();

  if (mode === 'eventScoped') {
    const data = eventScopedIsClaimedInterface.encodeFunctionData('isClaimed', [
      householdHash,
      eventHash,
    ]);
    const raw = await provider.call({ to, data });
    const [claimed] = eventScopedIsClaimedInterface.decodeFunctionResult('isClaimed', raw);
    return Boolean(claimed);
  }

  if (mode === 'legacy') {
    const data = legacyIsClaimedInterface.encodeFunctionData('isClaimed', [householdHash]);
    const raw = await provider.call({ to, data });
    const [claimed] = legacyIsClaimedInterface.decodeFunctionResult('isClaimed', raw);
    return Boolean(claimed);
  }

  throw new Error(
    `Deployed contract at ${to} (chainId=${getChainId()}) does not expose isClaimed check functions.`,
  );
}

export async function getTransactionReceipt(
  txHash: string,
): Promise<ethers.TransactionReceipt | null> {
  return getProvider().getTransactionReceipt(txHash);
}

export async function blockchainHealthCheck(): Promise<{
  connected: boolean;
  network?: string;
  chainId?: number;
  blockNumber?: number;
  contractDeployed?: boolean;
  ownerMatchesSigner?: boolean;
  error?: string;
}> {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const chainId = Number(network.chainId);

    const code = await provider.getCode(getContractAddress());
    const contractDeployed = code !== '0x';

    let ownerMatchesSigner: boolean | undefined;
    try {
      const contract = getContract();
      const hasOwnerFn =
        typeof contract.interface.hasFunction === 'function' &&
        contract.interface.hasFunction('owner()');
      if (hasOwnerFn) {
        const owner = String(await contract.owner()).toLowerCase();
        const signer = (await getSigner().getAddress()).toLowerCase();
        ownerMatchesSigner = owner === signer;
      }
    } catch {
      ownerMatchesSigner = undefined;
    }

    return {
      connected: true,
      network: network.name,
      chainId,
      blockNumber,
      contractDeployed,
      ownerMatchesSigner,
    };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Unknown blockchain health error' };
  }
}
