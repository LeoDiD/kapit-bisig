/**
 * SMS Service — Provider-agnostic SMS sender
 *
 * Supports pluggable SMS providers (Semaphore, Twilio, Vonage).
 * When no SMS_API_KEY is configured, falls back to **dry-run mode**
 * which logs the OTP to the server console — perfect for local dev.
 *
 * SECURITY:
 *  - SMS API key is NEVER exposed to the client.
 *  - OTP values are logged ONLY in dry-run mode (no API key).
 *  - In production with a key configured, OTP content is NEVER logged.
 *
 * Usage:
 *   import { sendSms, isSmsConfigured } from '../utils/smsService';
 *   await sendSms('09171234567', 'Your OTP is 123456');
 */

/* ------------------------------------------------------------------ */
/*  Provider types                                                     */
/* ------------------------------------------------------------------ */

type SmsProvider = 'semaphore' | 'twilio' | 'vonage';

interface SmsConfig {
  provider: SmsProvider;
  apiKey: string;
  senderName: string;
  /** Twilio-specific */
  twilioAccountSid?: string;
}

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

function loadSmsConfig(): SmsConfig | null {
  const apiKey = process.env.SMS_API_KEY?.trim();
  if (!apiKey) {
    return null; // Dry-run mode
  }

  const provider = (process.env.SMS_PROVIDER?.trim().toLowerCase() || 'semaphore') as SmsProvider;
  const senderName = process.env.SMS_SENDER_NAME?.trim() || 'KapitBisig';
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim();

  return { provider, apiKey, senderName, twilioAccountSid };
}

let _config: SmsConfig | null | undefined;

function getConfig(): SmsConfig | null {
  if (_config === undefined) {
    _config = loadSmsConfig();

    if (_config) {
      console.log(`[SmsService] Provider: ${_config.provider}, Sender: ${_config.senderName}`);
    } else {
      console.warn(
        '[SmsService] No SMS_API_KEY found. Running in DRY-RUN mode — OTPs will be logged to console.',
      );
    }
  }
  return _config;
}

/* ------------------------------------------------------------------ */
/*  Provider implementations                                           */
/* ------------------------------------------------------------------ */

async function sendViaSemaphore(config: SmsConfig, to: string, message: string): Promise<void> {
  const url = 'https://api.semaphore.co/api/v4/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: config.apiKey,
      number: to,
      message,
      sendername: config.senderName,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Semaphore SMS failed (${response.status}): ${body}`);
  }
}

async function sendViaTwilio(config: SmsConfig, to: string, message: string): Promise<void> {
  const accountSid = config.twilioAccountSid;
  if (!accountSid) {
    throw new Error('TWILIO_ACCOUNT_SID is required when SMS_PROVIDER=twilio');
  }

  // Twilio requires E.164 format — convert PH mobile (09...) to +639...
  const e164 = to.startsWith('0') ? `+63${to.slice(1)}` : to;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${config.apiKey}`).toString('base64');

  const formBody = new URLSearchParams({
    To: e164,
    From: config.senderName,
    Body: message,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Twilio SMS failed (${response.status}): ${body}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Vonage response shape                                              */
/* ------------------------------------------------------------------ */

interface VonageMessage {
  status: string;
  'error-text'?: string;
  [key: string]: unknown;
}

interface VonageResponse {
  messages?: VonageMessage[];
  [key: string]: unknown;
}

async function sendViaVonage(config: SmsConfig, to: string, message: string): Promise<void> {
  // Vonage requires E.164 without the + prefix
  const e164 = to.startsWith('0') ? `63${to.slice(1)}` : to.replace(/^\+/, '');

  const url = 'https://rest.nexmo.com/sms/json';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: config.apiKey,
      api_secret: process.env.VONAGE_API_SECRET || '',
      to: e164,
      from: config.senderName,
      text: message,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Vonage SMS failed (${response.status}): ${body}`);
  }

  const data = await response.json().catch(() => null) as VonageResponse | null;
  if (data?.messages?.[0]?.status !== '0') {
    throw new Error(
      `Vonage SMS rejected: ${data?.messages?.[0]?.['error-text'] || 'Unknown error'}`,
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

const APP_NAME = process.env.APP_NAME || 'KapitBisig';

/**
 * Check if SMS is configured (API key present).
 * Returns false in dry-run mode.
 */
export function isSmsConfigured(): boolean {
  return getConfig() !== null;
}

/**
 * Send an SMS message to a Philippine mobile number.
 *
 * In dry-run mode (no API key), logs the message to the console and
 * resolves successfully — the caller doesn't need to know the difference.
 */
export async function sendSms(to: string, message: string): Promise<void> {
  const config = getConfig();

  if (!config) {
    // Dry-run mode — log to console for dev testing
    console.log('┌──────────────────────────────────────────────────────');
    console.log(`│ [SMS DRY-RUN] To: ${to}`);
    console.log(`│ ${message}`);
    console.log('└──────────────────────────────────────────────────────');
    return;
  }

  switch (config.provider) {
    case 'semaphore':
      return sendViaSemaphore(config, to, message);
    case 'twilio':
      return sendViaTwilio(config, to, message);
    case 'vonage':
      return sendViaVonage(config, to, message);
    default:
      throw new Error(`Unsupported SMS provider: ${config.provider}`);
  }
}

/**
 * Send a registration OTP SMS.
 * Formats a standard OTP message.
 */
export async function sendRegistrationOtpSms(
  mobileNumber: string,
  otp: string,
): Promise<void> {
  const message = `[${APP_NAME}] Your registration verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
  return sendSms(mobileNumber, message);
}

/**
 * Send a registration success notification SMS.
 */
export async function sendRegistrationSuccessSms(
  mobileNumber: string,
  fullName: string,
): Promise<void> {
  const message = `[${APP_NAME}] Hi ${fullName}, your account has been created successfully! Your registration is pending review. You will be notified once approved.`;
  return sendSms(mobileNumber, message);
}
