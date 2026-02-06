// E-Mail-Versand mit Resend
import { Resend } from 'resend';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Lade .env und .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../../.env.local'), override: true });

export async function sendVerificationEmail(email: string, username: string, token: string) {
  // Prüfe ob Resend konfiguriert ist
  const apiKey = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || import.meta.env.EMAIL_FROM;
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  
  console.log('📧 E-Mail wird vorbereitet...');
  console.log('API Key vorhanden:', apiKey ? 'Ja' : 'NEIN');
  console.log('Email From:', emailFrom);
  console.log('Site URL:', siteUrl);
  
  if (!apiKey || apiKey === 're_123456789_YourResendAPIKey') {
    console.warn('⚠️ Resend API-Key nicht konfiguriert - E-Mail kann nicht gesendet werden');
    console.log('\n🔗 Verifikations-Link (nur für Entwicklung):', `${siteUrl}/api/auth/verify-email?token=${token}\n`);
    return false;
  }

  const resend = new Resend(apiKey);
  const verifyUrl = `${siteUrl}/api/auth/verify-email?token=${token}`;
  
  try {
    const result = await resend.emails.send({
      from: emailFrom || 'noreply@wulfghg.com',
      to: email,
      subject: 'Bestätige deine E-Mail-Adresse',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4a5568;">Hallo ${username}!</h2>
              <p>Danke für deine Registrierung. Bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Link klickst:</p>
              <div style="margin: 30px 0;">
                <a href="${verifyUrl}" 
                   style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  E-Mail bestätigen
                </a>
              </div>
              <p style="color: #718096; font-size: 14px;">
                Oder kopiere diesen Link in deinen Browser:<br>
                <span style="word-break: break-all;">${verifyUrl}</span>
              </p>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                Dieser Link ist 24 Stunden gültig.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #a0aec0; font-size: 12px;">
                Falls du dich nicht registriert hast, ignoriere diese E-Mail einfach.
              </p>
            </div>
          </body>
        </html>
      `
    });
    console.log('✓ Verifikations-E-Mail gesendet an:', email);
    return true;
  } catch (error) {
    console.error('❌ E-Mail senden fehlgeschlagen:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, username: string, token: string) {
  console.log('\n=== E-Mail-Versand Debug ===');
  // Prüfe ob Resend konfiguriert ist
  const apiKey = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || import.meta.env.EMAIL_FROM;
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  
  console.log('API Key vorhanden:', apiKey ? `Ja (${apiKey.substring(0, 10)}...)` : 'NEIN');
  console.log('Email From:', emailFrom);
  console.log('Site URL:', siteUrl);
  console.log('=========================\n');
  
  if (!apiKey || apiKey === 're_123456789_YourResendAPIKey') {
    console.warn('⚠️ Resend API-Key nicht konfiguriert - E-Mail kann nicht gesendet werden');
    console.log('\n🔗 Password-Reset-Link (nur für Entwicklung):', `${siteUrl}/reset-password?token=${token}\n`);
    return false;
  }

  const resend = new Resend(apiKey);
  const resetUrl = `${siteUrl}/reset-password?token=${token}`;
  
  try {
    const result = await resend.emails.send({
      from: emailFrom || 'noreply@wulfghg.com',
      to: email,
      subject: 'Passwort zurücksetzen',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4a5568;">Hallo ${username}!</h2>
              <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den folgenden Link, um ein neues Passwort festzulegen:</p>
              <div style="margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #f56565; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Passwort zurücksetzen
                </a>
              </div>
              <p style="color: #718096; font-size: 14px;">
                Oder kopiere diesen Link in deinen Browser:<br>
                <span style="word-break: break-all;">${resetUrl}</span>
              </p>
              <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                Dieser Link ist 1 Stunde gültig.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #a0aec0; font-size: 12px;">
                Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail einfach. Dein Passwort bleibt unverändert.
              </p>
            </div>
          </body>
        </html>
      `
    });
    console.log('✓ Password-Reset-E-Mail gesendet an:', email);
    return true;
  } catch (error) {
    console.error('❌ E-Mail senden fehlgeschlagen:', error);
    return false;
  }
}
