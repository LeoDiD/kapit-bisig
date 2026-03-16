const fs = require('fs');
const dotenv = require('dotenv');
require('@nomicfoundation/hardhat-toolbox');

for (const envPath of ['.env.local', '.env', '.env.local.bak']) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const rpcUrl = (
  process.env.RPC_URL ||
  process.env.GANACHE_RPC_URL ||
  process.env.GANACHE_URL ||
  ''
).trim();
const privateKey = (
  process.env.PRIVATE_KEY ||
  process.env.DEPLOYER_PRIVATE_KEY ||
  ''
).trim();
const selectedNetwork = process.env.HARDHAT_NETWORK;
const networkArgIndex = process.argv.findIndex((arg) => arg === '--network');
const networkArgValue =
  networkArgIndex >= 0 ? process.argv[networkArgIndex + 1] : undefined;
const targetNetwork = selectedNetwork || networkArgValue;

if (targetNetwork === 'sepolia' && !rpcUrl) {
  throw new Error(
    'Missing RPC URL for sepolia. Set one of RPC_URL, GANACHE_RPC_URL, or GANACHE_URL in apps/web/apps/.env.local',
  );
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.19',
  networks: {
    sepolia: {
      // Keep network declared so HH100 never occurs; guarded above when sepolia is targeted.
      url: rpcUrl || 'http://127.0.0.1:8545',
      chainId: Number(process.env.CHAIN_ID || 11155111),
      accounts: privateKey ? [privateKey] : [],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};
