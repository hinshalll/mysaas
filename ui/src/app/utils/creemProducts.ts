// Utility to map plans & cohorts to Creem.io Product IDs, and map them back on webhook events

export const getCreemProductId = (planId: 'pro' | 'api', cohort: 'global' | 'india'): string => {
  // Force fallback to Global USD plans (ignoring cohorts since only USD is configured in Creem)
  const proId = process.env.CREEM_PRODUCT_GLOBAL_PRO;
  const apiId = process.env.CREEM_PRODUCT_GLOBAL_API;
  
  const targetId = planId === 'api' ? apiId : proId;
  return targetId || '';
};

export const getTierFromProductId = (productId: string): 'pro' | 'api' | null => {
  if (!productId) return null;
  
  const pGlobalPro = process.env.CREEM_PRODUCT_GLOBAL_PRO;
  const pGlobalApi = process.env.CREEM_PRODUCT_GLOBAL_API;
  
  if (productId === pGlobalApi) {
    return 'api';
  }
  
  if (productId === pGlobalPro) {
    return 'pro';
  }
  
  return null;
};
