import mongoose from 'mongoose';
import ResidentPushDevice from '../models/ResidentPushDevice';
import type { PushDeliverySummary } from './distributionPush';

type PushTicket = { status?: string; details?: { error?: string } };

interface ResidentPushInput {
  residentId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface ResidentPushDependencies {
  configured?: boolean;
  send?: (messages: Array<Record<string, unknown>>) => Promise<PushTicket[]>;
}

function isExpoPushToken(value: string): boolean {
  return /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(value);
}

async function sendThroughExpo(messages: Array<Record<string, unknown>>): Promise<PushTicket[]> {
  const tickets: PushTicket[] = [];
  for (let index = 0; index < messages.length; index += 100) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages.slice(index, index + 100)),
    });
    if (!response.ok) throw new Error(`Expo push provider returned HTTP ${response.status}`);
    const result = await response.json() as { data?: PushTicket[] };
    tickets.push(...(Array.isArray(result.data) ? result.data : []));
  }
  return tickets;
}

/**
 * Sends a Firebase/FCM-backed Expo push to every active device registered by
 * one resident. Provider failure never changes the underlying business action.
 */
export async function sendResidentPushNotification(
  input: ResidentPushInput,
  dependencies: ResidentPushDependencies = {},
): Promise<PushDeliverySummary> {
  if (!mongoose.Types.ObjectId.isValid(input.residentId)) {
    return { status: 'no_eligible_recipients', attempted: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const devices = await ResidentPushDevice.find({
    residentId: new mongoose.Types.ObjectId(input.residentId),
    active: true,
  }).lean();
  const validDevices = devices.filter((device) => isExpoPushToken(device.expoPushToken));
  const invalidDevices = devices.filter((device) => !isExpoPushToken(device.expoPushToken));

  if (invalidDevices.length > 0) {
    await ResidentPushDevice.updateMany(
      { _id: mongoose.trusted({ $in: invalidDevices.map((device) => device._id) }) },
      { $set: { active: false, disabledReason: 'INVALID_TOKEN' } },
    );
  }

  const attempted = validDevices.length;
  const skipped = invalidDevices.length;
  if (attempted === 0) {
    return { status: 'no_eligible_recipients', attempted, sent: 0, skipped, failed: 0 };
  }

  const configured = dependencies.configured
    ?? (process.env.NODE_ENV === 'test' ? false : process.env.EXPO_PUSH_ENABLED === 'true');
  if (!configured) {
    return { status: 'provider_not_configured', attempted, sent: 0, skipped, failed: attempted };
  }

  const messages = validDevices.map((device) => ({
    to: device.expoPushToken,
    sound: 'default',
    channelId: 'default',
    title: input.title,
    body: input.body,
    data: input.data || {},
  }));

  try {
    const tickets = await (dependencies.send ?? sendThroughExpo)(messages);
    const rejectedTokens: string[] = [];
    let sent = 0;
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') sent += 1;
      if (ticket.details?.error === 'DeviceNotRegistered') {
        const token = validDevices[index]?.expoPushToken;
        if (token) rejectedTokens.push(token);
      }
    });

    if (rejectedTokens.length > 0) {
      await ResidentPushDevice.updateMany(
        { expoPushToken: mongoose.trusted({ $in: rejectedTokens }) },
        { $set: { active: false, disabledReason: 'DEVICE_NOT_REGISTERED' } },
      );
    }

    const failed = attempted - sent;
    return {
      status: sent === attempted
        ? 'sent_successfully'
        : sent > 0
          ? 'partially_delivered'
          : 'provider_request_failed',
      attempted,
      sent,
      skipped,
      failed,
    };
  } catch (error) {
    console.warn('[residentPush] Provider request failed:', error instanceof Error ? error.message : error);
    return { status: 'provider_request_failed', attempted, sent: 0, skipped, failed: attempted };
  }
}
