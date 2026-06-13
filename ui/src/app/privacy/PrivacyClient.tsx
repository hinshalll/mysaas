"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { eyebrow, sectionTitle } from '../../components/PageStyles';

export default function PrivacyClient() {
  const { theme } = useSaaS();
  const isLight = theme === 'light';

  const sections = [
    {
      title: '1. Data We Collect',
      content: 'We collect minimal usage analytics (page views, tool usage counts) via privacy-first analytics. We do not collect, store, or transmit any document contents, file data, or personally identifiable information through our tool processing pipeline. Files processed through on-device tools never leave your browser.',
    },
    {
      title: '2. On-Device Processing',
      content: 'The majority of our tools execute entirely within your browser using WebAssembly and JavaScript. Your files are processed locally on your device and are never uploaded to our servers unless you explicitly use a server-side tool (clearly labeled).',
    },
    {
      title: '3. Server-Side Processing',
      content: 'For tools that require server-side compute (PDF generation, OCR, bank statement parsing), files are streamed directly to memory, processed, and the result is returned immediately. We do not persist, cache, or log any uploaded content. Processing buffers are cleared after each request.',
    },
    {
      title: '4. Cookies & Tracking',
      content: 'We use only essential cookies for session management and user preferences (theme, last-used tool). We do not use third-party tracking pixels, advertising cookies, or fingerprinting technologies.',
    },
    {
      title: '5. Third-Party Services',
      content: 'We use Vercel for hosting and Render for backend compute during our prototype phase. Both services comply with GDPR and SOC2 standards. We do not share any user data with third parties for marketing or advertising purposes.',
    },
    {
      title: '6. Your Rights',
      content: 'You can request deletion of your account and all associated data at any time by contacting us. Since we store minimal data, most users have effectively zero stored personal information beyond their email address (if registered).',
    },
  ];

  return (
    <div style={{
      maxWidth: 880, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
      position: 'relative',
    }} className="fade-in">
      {/* Subpage ambient top-center glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 800, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
        opacity: isLight ? 0.08 : 0.15,
        zIndex: 0,
      }}/>

      <div style={{ marginBottom: 40, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Legal</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'var(--fg-dim)', marginTop: 8 }}>Last updated: May 27, 2026</p>
      </div>

      <div className="glass-card" style={{ position: 'relative', zIndex: 1, padding: '40px clamp(24px, 5vw, 48px)', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {sections.map((s) => (
            <div key={s.title}>
              <h2 style={{ fontSize: 17, color: 'var(--fg)', fontWeight: 600, margin: '0 0 10px', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>{s.title}</h2>
              <p style={{ fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.65, margin: 0 }}>{s.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{
        marginTop: 32, padding: '24px 28px',
        textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
          Questions about our privacy practices? <a href="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline', textDecorationColor: 'var(--accent)' }}>Contact us</a> and we'll respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
