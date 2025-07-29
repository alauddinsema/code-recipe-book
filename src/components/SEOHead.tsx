import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Code Recipe Book',
  description = 'Discover and share cooking recipes with code snippets. A unique platform for tech-savvy food lovers combining culinary creativity with programming.',
  keywords = 'recipes, cooking, code, programming, food, culinary, tech, developers, cooking recipes, code snippets',
  image = '/og-image.jpg',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
}) => {
  const fullTitle = title === 'Code Recipe Book' ? title : `${title} | Code Recipe Book`;
  const fullImageUrl = image.startsWith('http') ? image : `${typeof window !== 'undefined' ? window.location.origin : ''}${image}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author || 'Code Recipe Book');

    // Open Graph meta tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImageUrl, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Code Recipe Book', true);

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', fullImageUrl);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Add structured data
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredData);
    }

    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": type === 'article' ? 'Recipe' : 'WebSite',
      "name": fullTitle,
      "description": description,
      "url": url,
      "image": fullImageUrl,
      "author": {
        "@type": "Organization",
        "name": "Code Recipe Book"
      },
      ...(type === 'website' && {
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${typeof window !== 'undefined' ? window.location.origin : ''}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      })
    });

  }, [fullTitle, description, keywords, author, fullImageUrl, url, type, publishedTime, modifiedTime]);

  return null; // This component doesn't render anything visible
};

export default SEOHead;
