/**
 * Deploy ClaimLedger to Sepolia.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network sepolia
 *
 * After deployment, ABI + metadata are written to:
 *   server/blockchain/ClaimLedger.json
 * Runtime should still use CONTRACT_ADDRESS from env as source of truth.
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log('Deploying with account:', deployerAddress);

  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH');

  const ClaimLedger = await hre.ethers.getContractFactory('ClaimLedger');
  const contract = await ClaimLedger.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('ClaimLedger deployed to:', address);

  const owner = await contract.owner();
  if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
    throw new Error(`Owner mismatch after deployment. owner=${owner} deployer=${deployerAddress}`);
  }
  console.log('Owner verified:', owner);

  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log('Network:', hre.network.name, `(chainId=${chainId})`);

  const artifactPath = path.join(
    __dirname,
    '..',
    'artifacts',
    'contracts',
    'ClaimLedger.sol',
    'ClaimLedger.json',
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const outDir = path.join(__dirname, '..', 'server', 'blockchain');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, 'ClaimLedger.json');
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        address,
        abi: artifact.abi,
        deployedAt: new Date().toISOString(),
        network: hre.network.name,
        chainId,
        owner,
      },
      null,
      2,
    ),
  );

  console.log(`ABI + metadata saved to ${outFile}`);
  console.log(`Set CONTRACT_ADDRESS=${address} in .env.local`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
