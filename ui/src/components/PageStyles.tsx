"use client";

import React from 'react';
import { Check, X } from 'lucide-react';

export const eyebrow = "inline-block text-[11px] font-semibold text-[oklch(0.78_0.12_265)] tracking-[0.18em] uppercase mb-[18px]";

export const sectionTitle = "m-0 text-[clamp(34px,5vw,52px)] leading-[1.05] tracking-[-0.03em] font-semibold [text-wrap:balance]";

export const italicAccent = "font-serif italic font-normal bg-gradient-to-br from-[oklch(0.92_0.04_265)] to-[oklch(0.78_0.16_285)] text-transparent bg-clip-text";

export const sectionSubtitle = "mx-auto mt-5 max-w-[560px] text-[16px] text-[var(--fg-muted)] leading-relaxed [text-wrap:pretty]";

export const listStyle = "m-0 p-0 list-none flex flex-col gap-1 flex-1";

interface FeatureProps {
  children: React.ReactNode;
  on: boolean;
  em?: boolean;
}

export function Feature({ children, on, em }: FeatureProps) {
  return (
    <li className={`flex items-start gap-2.5 py-1 text-[13.5px] ${on ? 'text-[var(--fg)]' : 'text-[var(--fg-dim)]'} ${em ? 'font-semibold' : 'font-normal'}`}>
      <span className={`w-[18px] h-[18px] rounded-full inline-flex items-center justify-center shrink-0 mt-[1px] ${on ? 'bg-[oklch(0.32_0.10_145/0.4)] text-[oklch(0.85_0.16_145)]' : 'bg-[oklch(0.22_0.010_250)] text-[var(--fg-dim)]'}`}>
        {on ? <Check size={11} strokeWidth={2.5}/> : <X size={10} strokeWidth={2.2}/>}
      </span>
      <span>{children}</span>
    </li>
  );
}
