"use client";

import React from 'react';
import HeicToJpgConverterClient from '../../heic-to-jpg-converter/HeicToJpgConverterClient';
import UniversalAIFormatterClient from '../../universal-ai-formatter/UniversalAIFormatterClient';

interface FormatRedirectClientProps {
  slug: string;
}

export default function FormatRedirectClient({ slug }: FormatRedirectClientProps) {
  const parts = slug.split('-to-');
  if (parts.length === 2 && parts[0] === 'heic') {
    return <HeicToJpgConverterClient initialSlug={slug} />;
  }
  return <UniversalAIFormatterClient initialSlug={slug} />;
}
