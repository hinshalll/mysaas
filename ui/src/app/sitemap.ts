import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mysaas.com';

  // Core public marketing pages
  const corePages = [
    '',
    '/pricing',
    '/about',
    '/docs',
    '/blog',
    '/changelog',
    '/contact',
    '/privacy',
  ];

  // Category paths
  const categories = ['text', 'dev', 'files', 'media', 'pro'];

  // All individual tool subpages
  const toolSlugs = [
    'universal-ai-formatter',
    'ai-conversation-formatter',
    'auto-redactor-pii-scrubber',
    'base64-encoder-decoder',
    'batch-processing-engine',
    'csv-doctor',
    'csv-to-sql-generator',
    'custom-qr-logo-maker',
    'duplicate-image-finder',
    'excel-markdown-tables',
    'heic-to-jpg-converter',
    'html-to-print-ready-pdf',
    'json-formatter-validator',
    'json-yaml-csv-flattener',
    'metadata-scrubber',
    'mime-file-type-detector',
    'pdf-bank-parser',
    'pdf-scanned-text-extractor',
    'saved-history-branded-exports',
    'screenshot-to-excel-text',
    'smart-url-slug-maker',
    'sql-beautifier',
    'subtitle-resyncer',
    'transcript-cleaner',
    'ultimate-thumbnail-grabber',
    'unlimited-text-diff',
    'visual-pdf-diff-checker',
    'zip-tar-previewer',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add Core Pages
  corePages.forEach((page) => {
    sitemapEntries.push({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.8,
    });
  });

  // Add Categories
  categories.forEach((cat) => {
    sitemapEntries.push({
      url: `${baseUrl}/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  // Add Tools
  toolSlugs.forEach((slug) => {
    sitemapEntries.push({
      url: `${baseUrl}/tools/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  });

  return sitemapEntries;
}
