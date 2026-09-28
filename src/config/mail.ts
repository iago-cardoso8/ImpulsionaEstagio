import nodemailer from 'nodemailer';

interface MailTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS?: boolean;
  auth?: { user: string; pass: string };
}

let configPromise: Promise<MailTransportConfig | null> | undefined;

async function buildMailConfig(): Promise<MailTransportConfig | null> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const configuredHost = process.env.EMAIL_HOST?.trim();
  const hasCredentials = Boolean(process.env.EMAIL_USER || process.env.EMAIL_PASS);
  const useEthereal = isDevelopment && !hasCredentials && (!configuredHost || configuredHost === 'smtp.ethereal.email');
  const host = configuredHost || (useEthereal ? 'smtp.ethereal.email' : '');

  if (!host) return null;

  const port = Number(process.env.EMAIL_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('EMAIL_PORT deve ser uma porta válida');
  }

  const secure = process.env.EMAIL_SECURE === 'true';
  const config: MailTransportConfig = {
    host,
    port,
    secure,
    ...(!secure ? { requireTLS: true } : {}),
  };

  if (useEthereal) {
    const testAccount = await nodemailer.createTestAccount();
    config.auth = { user: testAccount.user, pass: testAccount.pass };
  } else {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS;
    if (Boolean(user) !== Boolean(pass)) {
      throw new Error('EMAIL_USER e EMAIL_PASS devem ser configurados juntos');
    }
    if (user && pass) config.auth = { user, pass };
  }

  return config;
}

export default function mailConfig(): Promise<MailTransportConfig | null> {
  configPromise ??= buildMailConfig().catch((error: unknown) => {
    configPromise = undefined;
    throw error;
  });
  return configPromise;
}