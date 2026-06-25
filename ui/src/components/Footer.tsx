"use client";

import React from 'react';
import Link from 'next/link';
import { useSaaS } from '../context/SaaSContext';
import { Command, GitBranch, Globe } from 'lucide-react';

interface FooterColProps {
  title: string;
  links: { label: string; path: string }[];
}

function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-[var(--fg)] mb-3 tracking-[0.08em] uppercase">
        {title}
      </div>
      <ul className="list-none m-0 p-0 flex flex-col gap-2">
        {links.map(l => (
          <li key={l.label}>
            <Link href={l.path} className="footer-link text-[12.5px] text-[var(--fg-muted)] no-underline hover:text-[var(--fg)] transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { brandName, backToLanding, view } = useSaaS();

  return (
    <footer className="mt-[60px] border-t border-[var(--border)] bg-[var(--bg-elev-1)]">
      <div className="footer-grid max-w-[1280px] mx-auto px-8 py-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[oklch(0.70_0.18_265)] to-[oklch(0.62_0.20_305)] flex items-center justify-center">
              <Command size={13} strokeWidth={2.2} className="text-white"/>
            </div>
            <span className="text-[14px] font-semibold" suppressHydrationWarning>{brandName}</span>
          </div>
          <p className="m-0 text-[12.5px] text-[var(--fg-subtle)] max-w-[280px] leading-[1.55]">
            The small utilities you keep googling, gathered into one keyboard-driven workspace. On-device by default.
          </p>
          <div className="flex gap-1.5 mt-3.5">
            <a className="reset footer-social w-[30px] h-[30px] rounded-md inline-flex items-center justify-center bg-[oklch(0.20_0.008_250)] border border-[var(--border)] text-[var(--fg-muted)] no-underline cursor-pointer hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-all" href="#">
              <GitBranch size={13}/>
            </a>
            <a className="reset footer-social w-[30px] h-[30px] rounded-md inline-flex items-center justify-center bg-[oklch(0.20_0.008_250)] border border-[var(--border)] text-[var(--fg-muted)] no-underline cursor-pointer hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-all" href="#">
              <Globe size={13}/>
            </a>
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
      <div className="border-t border-[var(--border)] px-8 py-3.5 flex items-center gap-3.5 text-[11.5px] text-[var(--fg-dim)] max-w-[1280px] mx-auto flex-wrap">
        <span suppressHydrationWarning>© 2026 {brandName.toLowerCase()}, inc.</span>
        {view !== 'landing' && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              backToLanding();
            }} 
            className="reset footer-link ml-auto cursor-pointer hover:text-[var(--fg)] transition-colors" 
          >
            ← Back to marketing page
          </button>
        )}
      </div>
    </footer>
  );
}
