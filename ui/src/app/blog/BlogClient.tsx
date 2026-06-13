"use client";

import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Icon } from '../../components/LucideIcons';
import { eyebrow, sectionTitle, sectionSubtitle } from '../../components/PageStyles';

export default function BlogClient() {
  const { theme, brandName } = useSaaS();
  const isLight = theme === 'light';

  const posts = [
    {
      title: `Why We Built ${brandName}: The Case for On-Device Utilities`,
      date: 'May 27, 2026',
      excerpt: 'Most file-processing websites upload your data to a server, process it, and send it back. We asked: what if the processing never left your browser?',
      hue: 265,
      readTime: '4 min read',
    },
    {
      title: 'Introducing the Universal AI Formatter',
      date: 'May 26, 2026',
      excerpt: 'Copy-paste from ChatGPT, Gemini, or Claude and get a beautifully formatted PDF, DOCX, or HTML document in seconds. Here\'s how it works under the hood.',
      hue: 195,
      readTime: '6 min read',
    },
    {
      title: 'Our Pricing Philosophy: Metered Freemium with PPP',
      date: 'May 25, 2026',
      excerpt: 'How we designed a pricing model that keeps core tools free forever while sustainably funding compute-heavy operations like OCR and PDF parsing.',
      hue: 75,
      readTime: '3 min read',
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

      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <span style={eyebrow}>Engineering & Product</span>
        <h1 style={{ ...sectionTitle, margin: '12px 0 0', color: 'var(--fg)' }}>Blog</h1>
        <p style={sectionSubtitle}>Behind-the-scenes engineering, product decisions, and the thinking that shapes our tools.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>
        {posts.map((post) => (
          <article key={post.title} className="glass-card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: `oklch(0.75 0.14 ${post.hue})`,
              }} />
              <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{post.date}</span>
              <span style={{ fontSize: 11, color: 'var(--fg-dim)', marginLeft: 'auto' }} className="mono">{post.readTime}</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', margin: '0 0 10px', lineHeight: 1.3 }}>{post.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.55 }}>{post.excerpt}</p>
            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                Read more <Icon.ArrowRight size={12} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
