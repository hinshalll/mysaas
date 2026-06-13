"use client";

import React from 'react';
import { useSaaS } from '../../../context/SaaSContext';
import { ALL_TOOLS } from '../../config';
import { supabase } from '../../supabase';
import JsonTool from './JsonTool';

export default function JsonFormatterValidatorClient() {
  const {
    brandName,
    userPlan,
    sessionUser,
    handleShowPaywall,
  } = useSaaS();

  const tool = ALL_TOOLS.find(t => t.id === 'json');

  if (!tool) return null;

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
