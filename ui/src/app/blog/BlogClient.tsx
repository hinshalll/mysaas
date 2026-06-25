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
    <div className="max-w-[880px] mx-auto mt-10 mb-[120px] px-8 box-border relative fade-in">
      {/* Subpage ambient top-center glow */}
      <div className={`absolute top-[-100px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] pointer-events-none z-0 ${isLight ? 'opacity-[0.08]' : 'opacity-[0.15]'}`} style={{
        background: 'radial-gradient(500px 200px at 50% 0%, var(--accent) 0%, transparent 70%)',
      }}/>

      <div className="text-center mb-12 relative z-[1]">
        <span className={eyebrow}>Engineering & Product</span>
        <h1 className={`${sectionTitle} mt-3 text-[var(--fg)]`}>Blog</h1>
        <p className={sectionSubtitle}>Behind-the-scenes engineering, product decisions, and the thinking that shapes our tools.</p>
      </div>

      <div className="flex flex-col gap-5 relative z-[1]">
        {posts.map((post) => (
          <article key={post.title} className="glass-card cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ background: `oklch(0.75 0.14 ${post.hue})` }} />
              <span className="text-[12px] text-[var(--fg-dim)]">{post.date}</span>
              <span className="text-[11px] text-[var(--fg-dim)] ml-auto mono">{post.readTime}</span>
            </div>
            <h2 className="text-[18px] font-semibold text-[var(--fg)] m-0 mb-2.5 leading-[1.3]">{post.title}</h2>
            <p className="text-[14px] text-[var(--fg-muted)] m-0 leading-[1.55]">{post.excerpt}</p>
            <div className="mt-3.5">
              <span className="text-[13px] text-[var(--accent)] font-medium inline-flex items-center gap-[5px]">
                Read more <Icon.ArrowRight size={12} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
