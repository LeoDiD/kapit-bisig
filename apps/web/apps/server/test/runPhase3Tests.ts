import { runAuthFlowUnitTests } from './authFlow.unit';
import { runNotificationFlowUnitTests } from './notificationFlow.unit';
import { runBeneficiaryFlowUnitTests } from './beneficiaryFlow.unit';

async function main(): Promise<void> {
  try {
    await runAuthFlowUnitTests();
    await runNotificationFlowUnitTests();
    await runBeneficiaryFlowUnitTests();
    console.log('All Phase 3 Tests Passed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

void main();
