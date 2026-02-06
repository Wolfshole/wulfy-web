// API-Route: E-Mail verifizieren
import type { APIRoute } from 'astro';
import { verifyEmailToken } from '../../../lib/kv';

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect('/login?error=invalid_token');
  }

  // Token validieren und User verifizieren
  const user = await verifyEmailToken(token);

  if (!user) {
    return redirect('/login?error=token_expired');
  }

  // Erfolgreich verifiziert
  return redirect('/dashboard?verified=true');
};
