import { runOfflineProofSyncIntegrationTests } from './offlineProofSync.integration';

async function main(): Promise<void> {
  await runOfflineProofSyncIntegrationTests();
  console.log('offline proof-sync integration tests passed');
}

void main();
