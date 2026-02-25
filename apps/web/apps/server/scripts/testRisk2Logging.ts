import assert from 'node:assert/strict';
import { sanitizeForLogs, maskIpAddress } from '../utils/logSanitizer';
import { logSecurity as unifiedLogSecurity } from '../middleware/unifiedAuth';
import { logSecurity as superadminLogSecurity } from '../middleware/superadminAuth';

type TestCase = {
  name: string;
  run: () => void | Promise<void>;
};

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function divider(): void {
  console.log('-'.repeat(80));
}

function step(title: string): void {
  console.log(`  -> ${title}`);
}

function assertStep(label: string, runAssert: () => void): void {
  runAssert();
  console.log(`     [OK] ${label}`);
}

function captureConsoleLog(fn: () => void): string[] {
  const originalLog = console.log;
  const logs: string[] = [];

  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
  };

  try {
    fn();
  } finally {
    console.log = originalLog;
  }

  return logs;
}

function withEnv(temp: Record<string, string | undefined>, fn: () => void): void {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(temp)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const tests: TestCase[] = [
  {
    name: 'Normal Case: operational metadata is masked but still readable',
    run: () => {
      step('Prepare normal operational payload');
      const payload = {
        action: 'LOGIN_SUCCESS',
        ip: '123.45.67.89',
        username: 'staff-lgu',
        statusCode: 200,
      };
      console.log(`     Input payload:\n${pretty(payload)}`);

      step('Run sanitizeForLogs(payload)');
      const safe = sanitizeForLogs(payload) as Record<string, unknown>;
      console.log(`     Sanitized payload:\n${pretty(safe)}`);

      step('Verify expected safe values');
      assertStep('action remains readable', () => assert.equal(safe.action, 'LOGIN_SUCCESS'));
      assertStep('statusCode remains readable', () => assert.equal(safe.statusCode, 200));
      assertStep('ip is masked', () => assert.equal(safe.ip, '123.45.***.***'));
      assertStep('username exists', () => assert.equal(typeof safe.username, 'string'));
      assertStep('username is not raw value', () => assert.notEqual(safe.username, 'staff-lgu'));
    },
  },
  {
    name: 'Attack Case: sensitive biometric/token/query fields are redacted recursively',
    run: () => {
      step('Prepare malicious payload with nested sensitive fields');
      const payload = {
        claimToken: 'ABCD-EFGH-IJKL',
        faceImage: 'data:image/jpeg;base64,AAAA',
        faceDescriptor: [0.1, 0.2, 0.3],
        query: 'face=1&token=2',
        nested: {
          authorization: 'Bearer abc.def.ghi',
          search: 'Juan Dela Cruz',
          imagePayload: 'raw-image-content',
        },
      };
      console.log(`     Input payload:\n${pretty(payload)}`);

      step('Run sanitizeForLogs(payload)');
      const safe = sanitizeForLogs(payload) as Record<string, unknown>;
      console.log(`     Sanitized payload:\n${pretty(safe)}`);

      step('Verify recursive redaction');
      assertStep('claimToken redacted', () => assert.equal(safe.claimToken, '[REDACTED]'));
      assertStep('faceImage redacted', () => assert.equal(safe.faceImage, '[REDACTED]'));
      assertStep('faceDescriptor redacted', () => assert.equal(safe.faceDescriptor, '[REDACTED]'));
      assertStep('query redacted', () => assert.equal(safe.query, '[REDACTED]'));

      const nested = safe.nested as Record<string, unknown>;
      assertStep('nested.authorization redacted', () => assert.equal(nested.authorization, '[REDACTED]'));
      assertStep('nested.search redacted', () => assert.equal(nested.search, '[REDACTED]'));
      assertStep('nested.imagePayload redacted', () => assert.equal(nested.imagePayload, '[REDACTED]'));
    },
  },
  {
    name: 'Edge Case: mixed-case keys + IPv6 + short values stay safe',
    run: () => {
      step('Prepare edge-case payload');
      const payload = {
        FaceImage: 'RAW',
        SearchQuery: 'sensitive text',
        ipAddress: '2001:db8:abcd:0012::1',
        email: 'a@b.com',
      };
      console.log(`     Input payload:\n${pretty(payload)}`);

      step('Run sanitizeForLogs(payload)');
      const safe = sanitizeForLogs(payload) as Record<string, unknown>;
      console.log(`     Sanitized payload:\n${pretty(safe)}`);

      step('Verify mixed-case and IPv6 handling');
      assertStep('FaceImage redacted', () => assert.equal(safe.FaceImage, '[REDACTED]'));
      assertStep('SearchQuery redacted', () => assert.equal(safe.SearchQuery, '[REDACTED]'));
      assertStep('IPv6 masked', () => assert.equal(safe.ipAddress, '2001:****:1'));
      assertStep('email is masked', () => assert.notEqual(safe.email, 'a@b.com'));
      assertStep('maskIpAddress IPv4 helper works', () =>
        assert.equal(maskIpAddress('10.20.30.40'), '10.20.***.***'),
      );
    },
  },
  {
    name: 'Production Guard: security logger is silent unless explicitly enabled',
    run: () => {
      step('Set NODE_ENV=production and unset ALLOW_SECURITY_CONSOLE_LOGS');
      withEnv({ NODE_ENV: 'production', ALLOW_SECURITY_CONSOLE_LOGS: undefined }, () => {
        step('Call unified auth security logger with sensitive fields');
        const logs = captureConsoleLog(() => {
          unifiedLogSecurity('ACCESS_DENIED', {
            faceImage: 'raw-biometric',
            ip: '123.123.123.123',
          });
        });

        console.log(`     Captured security logger lines: ${logs.length}`);
        assertStep('logger is silent in production by default', () => assert.equal(logs.length, 0));
      });
    },
  },
  {
    name: 'Production Enabled: logger output is sanitized when enabled',
    run: () => {
      step('Set NODE_ENV=production and ALLOW_SECURITY_CONSOLE_LOGS=true');
      withEnv({ NODE_ENV: 'production', ALLOW_SECURITY_CONSOLE_LOGS: 'true' }, () => {
        step('Call superadmin security logger with token + raw IP');
        const logs = captureConsoleLog(() => {
          superadminLogSecurity('ACCESS_DENIED', {
            claimToken: 'ABCD-EFGH-IJKL',
            ip: '123.123.123.123',
          });
        });

        const line = logs.join('\n');
        console.log(`     Captured security logger lines: ${logs.length}`);
        console.log(`     Captured sanitized output:\n${line || '(none)'}`);

        step('Verify sensitive values are not exposed');
        assertStep('some output exists', () => assert.equal(logs.length > 0, true));
        assertStep('raw token is absent', () => assert.equal(line.includes('ABCD-EFGH-IJKL'), false));
        assertStep('raw IP is absent', () => assert.equal(line.includes('123.123.123.123'), false));
        assertStep('redaction marker is present', () => assert.equal(line.includes('[REDACTED]'), true));
        assertStep('masked IP is present', () => assert.equal(line.includes('123.123.***.***'), true));
      });
    },
  },
];

async function main(): Promise<void> {
  let failed = 0;
  console.log('\nRisk #2 Automated Security Test: Log Disclosure Controls');
  divider();

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n[Case ${i + 1}/${tests.length}] ${test.name}`);
    try {
      await test.run();
      console.log('  Result: PASS');
    } catch (error) {
      failed += 1;
      console.error('  Result: FAIL');
      console.error(`  Reason: ${(error as Error).message}`);
    }
    divider();
  }

  if (failed > 0) {
    console.error(`\nFinal Result: ${failed} case(s) failed.`);
    process.exit(1);
  }

  console.log('\nFinal Result: all Risk #2 cases passed.');
}

main().catch((err) => {
  console.error('Fatal test runner error:', (err as Error).message);
  process.exit(1);
});

