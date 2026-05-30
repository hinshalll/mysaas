'use client';

import { useEffect, useState } from 'react';

export default function PrintPreviewPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clear any previous print html first to avoid stale data
    localStorage.removeItem('print_html');

    function checkAndPrint() {
      const html = localStorage.getItem('print_html');
      if (html) {
        setLoading(false);
        document.open();
        document.write(html);
        document.close();
        
        setTimeout(() => {
          window.focus();
          window.print();
          setTimeout(() => {
            window.close();
          }, 300);
        }, 250);
        return true;
      }
      return false;
    }

    // Try immediately
    if (checkAndPrint()) return;

    // Set up polling interval to check if parent page has written the HTML
    const interval = setInterval(() => {
      if (checkAndPrint()) {
        clearInterval(interval);
      }
    }, 100);

    // Also listen to storage events
    window.addEventListener('storage', (e) => {
      if (e.key === 'print_html') {
        if (checkAndPrint()) {
          clearInterval(interval);
        }
      }
    });

    // Cleanup timeout after 15 seconds in case parent task fails
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
      document.body.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; gap: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 16px; font-weight: 600;">Document generation timed out</div>
          <div style="font-size: 13px; color: #9ca3af;">Please close this tab and try again.</div>
        </div>
      `;
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: '#0b0f19',
        color: '#f3f4f6',
      }}>
        <div style={{
          border: '3px solid rgba(255, 255, 255, 0.1)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          borderLeftColor: '#6366f1',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }} />
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <div style={{
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.05em',
        }}>Generating Document PDF...</div>
      </div>
    );
  }

  return null;
}
