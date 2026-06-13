"use client";

import React from 'react';
import Link from 'next/link';
import { useSaaS } from '../context/SaaSContext';
import { Command, GitBranch, Globe } from 'lucide-react';

const socialStyle = {
  width: 30,
  height: 30,
  borderRadius: 7,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'oklch(0.20 0.008 250)',
  border: '1px solid var(--border)',
  color: 'var(--fg-muted)',
  textDecoration: 'none',
  cursor: 'pointer',
};

interface FooterColProps {
  title: string;
  links: { label: string; path: string }[];
}

function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--fg)',
        marginBottom: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>{title}</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(l => (
          <li key={l.label}>
            <Link href={l.path} className="footer-link" style={{
              fontSize: 12.5,
              color: 'var(--fg-muted)',
              textDecoration: 'none',
            }}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { brandName, backToLanding, view } = useSaaS();

  return (
    <footer style={{
      marginTop: 60,
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-elev-1)',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '36px 32px',
        display: 'grid',
        gridTemplateColumns: '1.4fr repeat(3, 1fr)',
        gap: 32,
      }} className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'linear-gradient(135deg, oklch(0.70 0.18 265), oklch(0.62 0.20 305))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Command size={13} strokeWidth={2.2} style={{ color: 'white' }}/>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }} suppressHydrationWarning>{brandName}</span>
          </div>
          <p style={{
            margin: 0,
            fontSize: 12.5,
            color: 'var(--fg-subtle)',
            maxWidth: 280,
            lineHeight: 1.55,
          }}>
            The small utilities you keep googling, gathered into one keyboard-driven workspace. On-device by default.
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <a className="reset footer-social" href="#" style={socialStyle}><GitBranch size={13}/></a>
            <a className="reset footer-social" href="#" style={socialStyle}><Globe size={13}/></a>
          </div>
        </div>

        <FooterCol title="Tools" links={[
          { label: 'Text & AI', path: '/category/text' },
          { label: 'Developer & Code', path: '/category/dev' },
          { label: 'Files & Data', path: '/category/files' },
          { label: 'Images & Media', path: '/category/media' },
          { label: 'Pro Vault', path: '/category/pro' }
        ]} />
        <FooterCol title="Product" links={[
          { label: 'Pricing', path: '/pricing' },
          { label: 'Changelog', path: '/changelog' },
          { label: 'APIs', path: '/api' },
          { label: 'Status', path: '/dashboard' },
          { label: 'Privacy', path: '/privacy' }
        ]} />
        <FooterCol title="Company" links={[
          { label: 'About', path: '/about' },
          { label: 'Blog', path: '/blog' },
          { label: 'Docs', path: '/docs' },
          { label: 'Contact', path: '/contact' },
          { label: 'Changelog', path: '/changelog' }
        ]} />
      </div>
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontSize: 11.5,
        color: 'var(--fg-dim)',
        maxWidth: 1280,
        margin: '0 auto',
        flexWrap: 'wrap',
      }}>
        <span suppressHydrationWarning>© 2026 {brandName.toLowerCase()}, inc.</span>
        {view !== 'landing' && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              backToLanding();
            }} 
            className="reset footer-link" 
            style={{ marginLeft: 'auto', cursor: 'pointer' }}
          >
            ← Back to marketing page
          </button>
        )}
      </div>
    </footer>
  );
}
