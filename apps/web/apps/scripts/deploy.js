/**
 * Deploy ClaimLedger to Ganache (or any configured network).
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network ganache
 *
 * After deployment the ABI + address are written to
 *   server/blockchain/ClaimLedger.json
 * so the backend can load them at runtime.
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH');

  // Deploy
  const ClaimLedger = await hre.ethers.getContractFactory('ClaimLedger');
  const contract = await ClaimLedger.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('ClaimLedger deployed to:', address);

  // ── Write ABI + address to a JSON the backend can import ──
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
      },
      null,
      2,
    ),
  );

  console.log(`ABI + address saved to ${outFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
