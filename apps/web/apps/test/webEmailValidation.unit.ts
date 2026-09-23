import assert from 'assert';
import { validateEmailFormat, MAX_EMAIL_LENGTH } from '../src/lib/inputValidation';

export async function runWebEmailValidationTests(): Promise<void> {
  console.log('Running Web Frontend Email Validation Tests...');

  // 1. Valid emails
  const validEmails = [
    'test@gmail.com',
    'john.doe+tag@example.co.uk',
    'user_name-123@sub.domain.org',
  ];
  for (const email of validEmails) {
    const res = validateEmailFormat(email);
    assert.strictEqual(res.isValid, true, `Expected valid email to pass: ${email}`);
  }

  // 2. Whitespace rejection
  const whitespaceEmails = [
    'test gmail@gmail.com',
    ' test@gmail.com',
    'test@gmail.com ',
    'test\t@gmail.com',
  ];
  for (const email of whitespaceEmails) {
    const res = validateEmailFormat(email);
    assert.strictEqual(res.isValid, false, `Expected whitespace email to fail: ${email}`);
    assert.strictEqual(res.error, 'Email must not contain spaces or whitespace');
  }

  // 3. Invalid formats
  const invalidFormats = [
    'test@gmail',
    '@gmail.com',
    'test@',
    'test<>@gmail.com',
  ];
  for (const email of invalidFormats) {
    const res = validateEmailFormat(email);
    assert.strictEqual(res.isValid, false, `Expected invalid email to fail: ${email}`);
    assert.strictEqual(res.error, 'Please enter a valid email address');
  }

  // 4. Length limits
  const longEmail = 'a'.repeat(55) + '@example.com';
  const lenRes = validateEmailFormat(longEmail);
  assert.strictEqual(lenRes.isValid, false);
  assert.strictEqual(lenRes.error, `Email must not exceed ${MAX_EMAIL_LENGTH} characters`);

  // 5. Empty
  const emptyRes = validateEmailFormat('');
  assert.strictEqual(emptyRes.isValid, false);
  assert.strictEqual(emptyRes.error, 'Email is required');

  console.log('All Web Frontend Email Validation Tests Passed!');
}
