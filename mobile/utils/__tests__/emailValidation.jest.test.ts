import { describe, it, expect } from '@jest/globals';
import { validateEmail, cleanEmailInput, MAX_EMAIL_LENGTH } from '../emailValidation';

describe('mobile emailValidation', () => {
  it('accepts standard valid email addresses', () => {
    expect(validateEmail('test@gmail.com').isValid).toBe(true);
    expect(validateEmail('user.name@domain.co').isValid).toBe(true);
    expect(validateEmail('user_name@domain.gov.ph').isValid).toBe(true);
    expect(validateEmail('user-name@domain.org').isValid).toBe(true);
    expect(validateEmail('user+tag@domain.net').isValid).toBe(true);
  });

  it('rejects empty or whitespace-only emails', () => {
    const emptyResult = validateEmail('');
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.error).toBe('Email is required');

    const whitespaceResult = validateEmail('   ');
    expect(whitespaceResult.isValid).toBe(false);
    expect(whitespaceResult.error).toBe('Email is required');
  });

  it('rejects emails containing whitespace characters', () => {
    const spaceInLocal = validateEmail('test gmail@gmail.com');
    expect(spaceInLocal.isValid).toBe(false);
    expect(spaceInLocal.error).toBe('Email must not contain spaces or whitespace');

    const leadingSpace = validateEmail(' test@gmail.com');
    expect(leadingSpace.isValid).toBe(false);
    expect(leadingSpace.error).toBe('Email must not contain spaces or whitespace');

    const trailingSpace = validateEmail('test@gmail.com ');
    expect(trailingSpace.isValid).toBe(false);
    expect(trailingSpace.error).toBe('Email must not contain spaces or whitespace');
  });

  it('rejects emails that exceed max length', () => {
    const longLocalPart = 'a'.repeat(55);
    const longEmail = `${longLocalPart}@example.com`; // 55 + 12 = 67 > 64
    const result = validateEmail(longEmail);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(`Email must not exceed ${MAX_EMAIL_LENGTH} characters`);
  });

  it('rejects invalid email formats', () => {
    expect(validateEmail('test@gmail').isValid).toBe(false);
    expect(validateEmail('test@gmail').error).toBe('Please enter a valid email address');

    expect(validateEmail('@gmail.com').isValid).toBe(false);
    expect(validateEmail('@gmail.com').error).toBe('Please enter a valid email address');

    expect(validateEmail('test@').isValid).toBe(false);
    expect(validateEmail('test@').error).toBe('Please enter a valid email address');

    expect(validateEmail('test<>@gmail.com').isValid).toBe(false);
    expect(validateEmail('test<>@gmail.com').error).toBe('Please enter a valid email address');
  });

  it('cleanEmailInput removes spaces and limits length', () => {
    expect(cleanEmailInput(' test @ gmail . com ')).toBe('test@gmail.com');
    const tooLong = 'a'.repeat(70) + '@example.com';
    expect(cleanEmailInput(tooLong).length).toBe(MAX_EMAIL_LENGTH);
  });
});
