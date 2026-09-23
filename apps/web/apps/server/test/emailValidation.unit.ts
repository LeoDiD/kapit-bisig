import assert from 'assert';
import { email as safeEmail } from '../validation/shared';

export async function runEmailValidationUnitTests(): Promise<void> {
  console.log('Running Email Validation Schema Unit Tests...');

  // 1. Valid emails
  const validEmails = [
    'test@gmail.com',
    'user.name@domain.co',
    'user_name@domain.gov.ph',
    'user-name@domain.org',
    'user+tag@domain.net',
  ];

  for (const v of validEmails) {
    const result = safeEmail.safeParse(v);
    assert.strictEqual(result.success, true, `Expected valid email to pass: ${v}`);
    assert.strictEqual(result.data, v.toLowerCase());
  }

  // 2. Reject whitespace
  const whitespaceEmails = [
    'test gmail@gmail.com',
    ' test@gmail.com',
    'test@gmail.com ',
    'test\t@gmail.com',
    'test\n@gmail.com',
  ];

  for (const w of whitespaceEmails) {
    const result = safeEmail.safeParse(w);
    assert.strictEqual(result.success, false, `Expected email with whitespace to fail: ${w}`);
  }

  // 3. Reject invalid formats
  const invalidFormats = [
    'test@gmail',
    '@gmail.com',
    'test@',
    'test<>@gmail.com',
    'plainaddress',
    'test@.com',
  ];

  for (const inv of invalidFormats) {
    const result = safeEmail.safeParse(inv);
    assert.strictEqual(result.success, false, `Expected invalid email to fail: ${inv}`);
  }

  // 4. Reject exceeded length (> 64 chars)
  const longLocalPart = 'a'.repeat(55);
  const longEmail = `${longLocalPart}@example.com`; // 55 + 12 = 67 > 64
  const lenResult = safeEmail.safeParse(longEmail);
  assert.strictEqual(lenResult.success, false, 'Expected > 64 character email to fail');

  console.log('Email Validation Schema Unit Tests Passed!');
}
