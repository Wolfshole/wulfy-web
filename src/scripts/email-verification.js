// E-Mail-Verifikations-Script
const resendBtn = document.getElementById('resend-verification');

if (resendBtn) {
  resendBtn.addEventListener('click', async () => {
    resendBtn.disabled = true;
    resendBtn.textContent = 'Wird gesendet...';
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        resendBtn.textContent = '✓ E-Mail gesendet!';
        resendBtn.style.background = '#48bb78';
        resendBtn.style.color = 'white';
        
        setTimeout(() => {
          resendBtn.textContent = 'E-Mail erneut senden';
          resendBtn.style.background = 'white';
          resendBtn.style.color = '#667eea';
          resendBtn.disabled = false;
        }, 5000);
      } else {
        throw new Error(data.error || 'Fehler beim Senden');
      }
    } catch (error) {
      resendBtn.textContent = '✗ Fehler';
      resendBtn.style.background = '#f56565';
      resendBtn.style.color = 'white';
      
      setTimeout(() => {
        resendBtn.textContent = 'E-Mail erneut senden';
        resendBtn.style.background = 'white';
        resendBtn.style.color = '#667eea';
        resendBtn.disabled = false;
      }, 3000);
    }
  });
}
