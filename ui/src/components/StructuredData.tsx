import React from 'react';

export default function StructuredData() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MySaaS Utility Hub",
    "url": "https://mysaas.com",
    "logo": "https://mysaas.com/logo.png",
    "description": "An all-in-one developer and professional utility workspace featuring AI formatting, JSON validation, and secure cloud workflows.",
    "sameAs": [
      "https://github.com/hinshalll/mysaas"
    ]
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "MySaaS Utility Workspace",
    "url": "https://mysaas.com",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "9.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
    </>
  );
}
