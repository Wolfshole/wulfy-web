// Debug-Route: Session-Info anzeigen
import type { APIRoute } from 'astro';
import { validateSession } from '../../../lib/kv';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get('session_id')?.value;
  
  console.log('🔍 Debug Session - Cookie:', sessionId);
  
  if (!sessionId) {
    return new Response(JSON.stringify({ 
      error: 'Kein session_id Cookie gefunden'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const user = await validateSession(sessionId);
  
  console.log('🔍 Debug Session - User:', user);
  
  return new Response(JSON.stringify({ 
    sessionId,
    user: user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    } : null,
    isValid: !!user
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
