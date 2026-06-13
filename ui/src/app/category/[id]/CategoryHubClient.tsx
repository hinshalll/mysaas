"use client";

import React from 'react';
import { useSaaS } from '../../../context/SaaSContext';
import { CATEGORIES } from '../../config';
import ToolCard from '../../../components/ToolCard';
import { tintFg } from '../../../components/LucideIcons';

interface CategoryHubClientProps {
  categoryId: string;
}

export default function CategoryHubClient({ categoryId }: CategoryHubClientProps) {
  const { openTool } = useSaaS();
  const category = CATEGORIES.find(c => c.id === categoryId);

  if (!category) {
    return (
      <div style={{ textAlign: 'center', margin: '80px auto', color: 'var(--fg-dim)' }}>
        Category not found.
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1200, margin: '40px auto 120px',
      padding: '0 32px', boxSizing: 'border-box',
    }} className="fade-in">
      <div style={{ marginBottom: 36 }}>
        <span style={{
          display: 'inline-block', fontSize: 11, fontWeight: 600,
          color: tintFg(category.hue), letterSpacing: '0.15em', textTransform: 'uppercase',
          marginBottom: 12,
        }} className="mono">
          Category Hub
        </span>
        <h1 style={{
          margin: 0, fontSize: 38, fontWeight: 600,
          letterSpacing: '-0.025em',
        }}>{category.label}</h1>
        <p style={{
          margin: '10px 0 0', fontSize: 15,
          color: 'var(--fg-muted)', maxWidth: 600, lineHeight: 1.5,
        }}>{category.tagline}</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {category.tools.map(t => (
          <ToolCard key={t.id} tool={{ ...t, hue: category.hue }} onClick={() => openTool(t.id)} />
        ))}
      </div>
    </div>
  );
}
