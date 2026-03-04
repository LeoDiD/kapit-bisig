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

export async function isClaimedOnChain(householdHash: string): Promise<boolean> {
  const contract = getContract();
  return contract.isClaimed(householdHash);
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
