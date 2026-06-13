"use client";

import React from 'react';
import { Check, X } from 'lucide-react';

export const eyebrow: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  color: 'oklch(0.78 0.12 265)',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  marginBottom: 18,
};

export const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(34px, 5vw, 52px)',
  lineHeight: 1.05,
  letterSpacing: '-0.03em',
  fontWeight: 600,
  textWrap: 'balance',
};

export const italicAccent: React.CSSProperties = {
  fontFamily: '"Source Serif Pro", Georgia, serif',
  fontStyle: 'italic',
  fontWeight: 400,
  background: 'linear-gradient(110deg, oklch(0.92 0.04 265), oklch(0.78 0.16 285))',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

export const sectionSubtitle: React.CSSProperties = {
  margin: '20px auto 0',
  maxWidth: 560,
  fontSize: 16,
  color: 'var(--fg-muted)',
  lineHeight: 1.5,
  textWrap: 'pretty',
};

export const listStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
};

interface FeatureProps {
  children: React.ReactNode;
  on: boolean;
  em?: boolean;
}

export function Feature({ children, on, em }: FeatureProps) {
  return (
    <li style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '4px 0',
      fontSize: 13.5,
      color: on ? 'var(--fg)' : 'var(--fg-dim)',
      fontWeight: em ? 600 : 400,
    }}>
      <span style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
        background: on ? 'oklch(0.32 0.10 145 / 0.4)' : 'oklch(0.22 0.010 250)',
        color: on ? 'oklch(0.85 0.16 145)' : 'var(--fg-dim)',
      }}>
        {on ? <Check size={11} strokeWidth={2.5}/> : <X size={10} strokeWidth={2.2}/>}
      </span>
      <span>{children}</span>
    </li>
  );
}
