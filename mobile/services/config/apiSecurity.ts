const DEV_HOST_ALLOWLIST = new Set(['localhost', '127.0.0.1', '::1']);

function isPrivateIPv4(hostname: string): boolean {
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;

  const match172 = hostname.match(/^172\.(\d{1,3})\./);
  if (match172) {
    const secondOctet = Number(match172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

function ensureSecureApiUrl(rawUrl: string, serviceLabel: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`${serviceLabel}: Invalid API URL "${rawUrl}"`);
  }

  const isHttp = parsed.protocol === 'http:';
  const isHttps = parsed.protocol === 'https:';

  if (!isHttp && !isHttps) {
    throw new Error(`${serviceLabel}: Unsupported URL protocol "${parsed.protocol}"`);
  }

  if (isHttps) {
    return;
  }

  const host = parsed.hostname;
  const isDevHost = DEV_HOST_ALLOWLIST.has(host) || isPrivateIPv4(host);

  if (__DEV__ && isDevHost) {
    return;
  }

  throw new Error(
    `${serviceLabel}: Insecure HTTP URL is not allowed outside local development.`,
  );
}

export function resolveApiBaseUrl(
  envValue: string | undefined,
  fallbackValue: string,
  serviceLabel: string,
): string {
  const value = (envValue && envValue.trim()) || fallbackValue;
  ensureSecureApiUrl(value, serviceLabel);
  return value.replace(/\/+$/, '');
}

