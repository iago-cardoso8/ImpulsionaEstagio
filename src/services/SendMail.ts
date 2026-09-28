import nodemailer from 'nodemailer';
import mailConfig from '../config/mail';

interface NewUserEmail {
  name: string;
  email: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

async function createNewUser(user: NewUserEmail): Promise<boolean> {
  try {
    const config = await mailConfig();
    const from = process.env.EMAIL_FROM?.trim();
    if (!config) {
      console.warn(`SMTP não configurado: e-mail de boas-vindas para ${user.email} não enviado.`);
      return false;
    }
    if (!from) {
      console.warn(`EMAIL_FROM não configurado: e-mail de boas-vindas para ${user.email} não enviado.`);
      return false;
    }

    const transporter = nodemailer.createTransport(config);
    const safeName = escapeHtml(user.name);
    const info = await transporter.sendMail({
      from,
      to: user.email,
      subject: 'Sua conta no Impulsiona Estágio foi criada',
      text: `Olá, ${user.name}! Sua conta foi criada com sucesso. Acesse o Impulsiona Estágio para continuar.`,
      html: `<p>Olá, ${safeName}!</p><p>Sua conta foi criada com sucesso.</p><p>Acesse o Impulsiona Estágio para continuar.</p>`,
    });

    if (process.env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`Prévia do e-mail: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error(`Falha ao enviar e-mail de boas-vindas para ${user.email}:`, error);
    return false;
  }
}

export default { createNewUser };