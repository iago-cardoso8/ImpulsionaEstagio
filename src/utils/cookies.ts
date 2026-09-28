export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = Object.create(null);

  for (const pair of header?.split(';') ?? []) {
    const [name, ...rest] = pair.split('=');
    const key = name?.trim();
    if (!key) continue;

    const value = rest.join('=').trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }

  return cookies;
}