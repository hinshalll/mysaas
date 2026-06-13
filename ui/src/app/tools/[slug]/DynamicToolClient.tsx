"use client";

import React from 'react';
import { useSaaS } from '../../../context/SaaSContext';
import { ALL_TOOLS } from '../../config';
import { supabase } from '../../supabase';
import ComingSoonStub from '../../../components/ComingSoonStub';
import dynamic from 'next/dynamic';

const FormatterTool = dynamic(() => import('../universal-ai-formatter/FormatterTool'), {
  loading: () => <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-dim)' }}>Loading Formatter Workspace...</div>,
  ssr: false,
});

const JsonTool = dynamic(() => import('../json-formatter-validator/JsonTool'), {
  loading: () => <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-dim)' }}>Loading JSON Workspace...</div>,
  ssr: false,
});

const HeicTool = dynamic(() => import('../heic-to-jpg-converter/HeicTool'), {
  loading: () => <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-dim)' }}>Loading Converter Workspace...</div>,
  ssr: false,
});

interface DynamicToolClientProps {
  slug: string;
}

export default function DynamicToolClient({ slug }: DynamicToolClientProps) {
  const {
    brandName,
    userPlan,
    sessionUser,
    handleShowPaywall,
    checkAndLogUsage,
  } = useSaaS();

  // Normalize slug to handle aliases if any
  const normalizedSlug = slug === 'uaf' ? 'universal-ai-formatter' : slug === 'heic' ? 'heic-to-jpg-converter' : slug;

  const tool = ALL_TOOLS.find(t => t.id === normalizedSlug || t.id === slug);

  if (!tool) {
    return (
      <div style={{ textAlign: 'center', margin: '80px auto', color: 'var(--fg-dim)' }}>
        Tool not found.
      </div>
    );
  }

  // Render implemented tools directly
  if (tool.id === 'universal-ai-formatter') {
    return (
      <FormatterTool
        tool={tool}
        initialSlug="universal-ai-formatter"
        brandName={brandName}
        userPlan={userPlan}
        sessionUser={sessionUser}
        onShowPaywall={handleShowPaywall}
        supabase={supabase}
        checkAndLogUsage={checkAndLogUsage}
      />
    );
  }

  if (tool.id === 'json') {
    return (
      <JsonTool
        tool={tool}
        brandName={brandName}
        userPlan={userPlan}
        sessionUser={sessionUser}
        onShowPaywall={handleShowPaywall}
        supabase={supabase}
      />
    );
  }

  if (tool.id === 'heic-to-jpg-converter') {
    return (
      <HeicTool
        tool={tool}
        initialSlug="heic-to-jpg-converter"
        brandName={brandName}
        userPlan={userPlan}
        sessionUser={sessionUser}
        onShowPaywall={handleShowPaywall}
        supabase={supabase}
        checkAndLogUsage={checkAndLogUsage}
      />
    );
  }

  // Fallback to Coming Soon stub for all other tools in active development
  return <ComingSoonStub tool={tool} />;
}
