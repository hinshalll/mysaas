// Utility to map plans & cohorts to Creem.io Product IDs, and map them back on webhook events

export const getCreemProductId = (planId: 'pro' | 'api', cohort: 'global' | 'india'): string => {
  const proId = cohort === 'india' 
    ? process.env.CREEM_PRODUCT_INDIA_PRO 
    : process.env.CREEM_PRODUCT_GLOBAL_PRO;
  
  const apiId = cohort === 'india' 
    ? process.env.CREEM_PRODUCT_INDIA_API 
    : process.env.CREEM_PRODUCT_GLOBAL_API;
  
  const targetId = planId === 'api' ? apiId : proId;
  return targetId || '';
};

export const getTierFromProductId = (productId: string): 'pro' | 'api' | null => {
  if (!productId) return null;
  
  const pGlobalPro = process.env.CREEM_PRODUCT_GLOBAL_PRO;
  const pGlobalApi = process.env.CREEM_PRODUCT_GLOBAL_API;
  const pIndiaPro = process.env.CREEM_PRODUCT_INDIA_PRO;
  const pIndiaApi = process.env.CREEM_PRODUCT_INDIA_API;
  
  if (productId === pGlobalApi || productId === pIndiaApi) {
    return 'api';
  }
  
  if (productId === pGlobalPro || productId === pIndiaPro) {
    return 'pro';
  }
  
  return null;
};
