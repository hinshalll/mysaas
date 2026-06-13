"use client";

import React from 'react';
import { useSaaS } from '../../../context/SaaSContext';
import { ALL_TOOLS } from '../../config';
import { supabase } from '../../supabase';
import HeicTool from './HeicTool';

interface HeicToJpgConverterClientProps {
  initialSlug?: string;
}

export default function HeicToJpgConverterClient({ initialSlug = "heic-to-jpg-converter" }: HeicToJpgConverterClientProps) {
  const {
    brandName,
    userPlan,
    sessionUser,
    handleShowPaywall,
    checkAndLogUsage,
  } = useSaaS();

  const tool = ALL_TOOLS.find(t => t.id === 'heic-to-jpg-converter');

  if (!tool) return null;

  return (
    <HeicTool
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
