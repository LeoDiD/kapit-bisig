/**
 * Blockchain Service
 *
 * Connects to Ganache via ethers, signs and sends transactions
 * to the on-chain ClaimLedger contract.
 *
 * All heavy crypto stays here — the rest of the backend only calls:
 *   • recordClaim(householdHash, eventHash)
 *   • isClaimed(householdHash)
 */

import { ethers } from 'ethers';
import path from 'path';
import fs from 'fs';

/* ------------------------------------------------------------------ */
/*  Config helpers                                                     */
/* ------------------------------------------------------------------ */

function env(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

interface ContractArtifact {
  address: string;
  abi: ethers.InterfaceAbi;
}

function loadArtifact(): ContractArtifact {
  // Prefer CONTRACT_ADDRESS from env (set after deploy)
  const envAddress = env('CONTRACT_ADDRESS');

  // Try to load the deploy-generated JSON
  const jsonPath = path.join(__dirname, '..', 'blockchain', 'ClaimLedger.json');
  if (fs.existsSync(jsonPath)) {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return {
      address: envAddress || raw.address,
      abi: raw.abi,
    };
  }

  // Fallback: load from Hardhat artifacts
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
    return {
      address: envAddress,
      abi: raw.abi,
    };
  }

  throw new Error(
    'ClaimLedger ABI not found. Run `npx hardhat run scripts/deploy.js --network ganache` first.',
  );
}

/* ------------------------------------------------------------------ */
/*  Singleton provider / signer / contract                             */
/* ------------------------------------------------------------------ */

let _provider: ethers.JsonRpcProvider | null = null;
let _signer: ethers.Wallet | null = null;
let _contract: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    const rpcUrl = env('GANACHE_RPC_URL', 'http://127.0.0.1:7545');
    _provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return _provider;
}

function getSigner(): ethers.Wallet {
  if (!_signer) {
    const pk = env('PRIVATE_KEY');
    if (!pk) throw new Error('PRIVATE_KEY env var is not set');
    _signer = new ethers.Wallet(pk, getProvider());
  }
  return _signer;
}

function getContract(): ethers.Contract {
  if (!_contract) {
    const { address, abi } = loadArtifact();
    if (!address) {
      throw new Error(
        'Contract address not found. Deploy the contract and set CONTRACT_ADDRESS in .env.local',
      );
    }
    _contract = new ethers.Contract(address, abi, getSigner());
  }
  return _contract;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface RecordClaimResult {
  txHash: string;
  blockNumber: number;
  staffSigner: string;
}

/**
 * Write a claim to the ClaimLedger contract.
 *
 * @param householdHash  bytes32 keccak256 hash
 * @param eventHash      bytes32 keccak256 hash
 * @returns Transaction receipt info
 */
export async function recordClaimOnChain(
  householdHash: string,
  eventHash: string,
): Promise<RecordClaimResult> {
  const contract = getContract();
  const signer = getSigner();

  const tx = await contract.recordClaim(householdHash, eventHash);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    staffSigner: signer.address,
  };
}

/**
 * Read-only check whether a household hash is already claimed on-chain.
 */
export async function isClaimedOnChain(householdHash: string): Promise<boolean> {
  const contract = getContract();
  return contract.isClaimed(householdHash);
}

/**
 * Health check — returns true when the provider is reachable
 * and the contract is deployed (code size > 0).
 */
export async function blockchainHealthCheck(): Promise<{
  connected: boolean;
  network?: string;
  blockNumber?: number;
  contractDeployed?: boolean;
  error?: string;
}> {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    let contractDeployed = false;
    try {
      const { address } = loadArtifact();
      if (address) {
        const code = await provider.getCode(address);
        contractDeployed = code !== '0x';
      }
    } catch {
      // Contract not yet deployed — that's OK
    }

    return {
      connected: true,
      network: network.name,
      blockNumber,
      contractDeployed,
    };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}
