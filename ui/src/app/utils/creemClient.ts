// Shared Creem SDK client factory — single source of truth for all billing routes
// Automatically selects test vs production server based on API key prefix

import { Creem } from 'creem';

let _creem: Creem | null = null;

export function getCreemClient(): Creem {
  if (_creem) return _creem;

  const apiKey = process.env.CREEM_API_KEY || '';
  const isTestMode = apiKey.startsWith('creem_test_');

  _creem = new Creem({
    apiKey,
    serverIdx: isTestMode ? 1 : 0, // 0 = production (api.creem.io), 1 = test (test-api.creem.io)
  });

  return _creem;
}
