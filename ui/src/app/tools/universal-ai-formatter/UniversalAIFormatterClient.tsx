"use client";

import React from 'react';
import { useSaaS } from '../../../context/SaaSContext';
import { ALL_TOOLS } from '../../config';
import { supabase } from '../../supabase';
import FormatterTool from './FormatterTool';

interface UniversalAIFormatterClientProps {
  initialSlug?: string;
}

export default function UniversalAIFormatterClient({ initialSlug = "universal-ai-formatter" }: UniversalAIFormatterClientProps) {
  const {
    brandName,
    userPlan,
    sessionUser,
    handleShowPaywall,
    checkAndLogUsage
  } = useSaaS();

  const tool = ALL_TOOLS.find(t => t.id === 'universal-ai-formatter');

  if (!tool) return null;

  return (
    <FormatterTool
      tool={tool}
      initialSlug={initialSlug}
      brandName={brandName}
      userPlan={userPlan}
      sessionUser={sessionUser}
      onShowPaywall={handleShowPaywall}
      supabase={supabase}
      checkAndLogUsage={checkAndLogUsage}
    />
  );
}
