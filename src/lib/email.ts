// E-Mail-Versand mit Resend
import { Resend } from 'resend';

export async function sendVerificationEmail(email: string, username: string, token: string) {
  // Prüfe ob Resend konfiguriert ist
  if (!import.meta.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY === 're_123456789_YourResendAPIKey') {
    console.warn('Resend API-Key nicht konfiguriert - E-Mail kann nicht gesendet werden');
    console.log('Verifikations-Link (nur für Entwicklung):', `${import.meta.env.PUBLIC_SITE_URL}/api/auth/verify-email?token=${token}`);
    return false;
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const verifyUrl = `${import.meta.env.PUBLIC_SITE_URL}/api/auth/verify-email?token=${token}`;
  
  try {
    await resend.emails.send({
      from: import.meta.env.EMAIL_FROM || 'noreply@wulfghg.com',
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
    return true;
  } catch (error) {
    console.error('E-Mail senden fehlgeschlagen:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, username: string, token: string) {
  // Prüfe ob Resend konfiguriert ist
  if (!import.meta.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY === 're_123456789_YourResendAPIKey') {
    console.warn('Resend API-Key nicht konfiguriert - E-Mail kann nicht gesendet werden');
    console.log('Password-Reset-Link (nur für Entwicklung):', `${import.meta.env.PUBLIC_SITE_URL}/reset-password?token=${token}`);
    return false;
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const resetUrl = `${import.meta.env.PUBLIC_SITE_URL}/reset-password?token=${token}`;
  
  try {
    await resend.emails.send({
      from: import.meta.env.EMAIL_FROM || 'noreply@wulfghg.com',
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
    return true;
  } catch (error) {
    console.error('E-Mail senden fehlgeschlagen:', error);
    return false;
  }
}
