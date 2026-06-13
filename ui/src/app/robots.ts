import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/account', '/developer', '/api/'],
    },
    sitemap: 'https://mysaas.com/sitemap.xml',
  };
}
