// API-Route: Logout
import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/kv';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const sessionId = cookies.get('session_id')?.value;
  
  if (sessionId) {
    await deleteSession(sessionId);
  }
  
  // Cookie löschen
  cookies.delete('session_id', {
    path: '/'
  });
  
  console.log('👋 Logout erfolgreich');
  
  return redirect('/login');
};
