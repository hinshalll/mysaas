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
    <div className="max-w-[880px] mx-auto mt-10 mb-[120px] px-8 relative box-border fade-in">
      {/* Subpage ambient top-center glow */}
      <div 
        className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 transition-opacity duration-200"
        style={{
          background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
          opacity: isLight ? 0.08 : 0.15,
        }}
      />

      <div className="mb-10 text-center relative z-10">
        <span className={eyebrow}>Legal</span>
        <h1 className={`${sectionTitle} mt-3 mb-0 text-fg`}>Privacy Policy</h1>
        <p className="text-[13px] text-fg-dim mt-2">Last updated: May 27, 2026</p>
      </div>

      <div className="glass-card relative z-10 py-10 px-[clamp(24px,5vw,48px)] gap-8">
        <div className="flex flex-col gap-7">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-[17px] text-fg font-semibold m-0 mb-2.5 border-b border-border pb-2">{s.title}</h2>
              <p className="text-[14.5px] text-fg-muted leading-[1.65] m-0">{s.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card mt-8 py-6 px-7 text-center relative z-10">
        <p className="text-[14px] text-fg-muted m-0 leading-[1.5]">
          Questions about our privacy practices? <a href="/contact" className="text-accent underline decoration-accent hover:text-fg transition-colors">Contact us</a> and we'll respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
