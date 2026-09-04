import { runDistributionFlowUnitTests } from './distributionFlow.unit';
import { runDistributionFlowIntegrationTests } from './distributionFlow.integration';
import { runDistributionSmsUnitTests } from './distributionSms.unit';

async function main(): Promise<void> {
  runDistributionFlowUnitTests();
  await runDistributionSmsUnitTests();
  await runDistributionFlowIntegrationTests();
  console.log('distribution-flow unit tests passed');
  console.log('distribution-flow integration tests passed');
}

void main();
