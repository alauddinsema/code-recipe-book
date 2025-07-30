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
  // Recipe-specific props
  recipe?: {
    ingredients?: string[];
    instructions?: string[];
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    difficulty?: string;
    category?: string;
    tags?: string[];
    averageRating?: number;
    ratingCount?: number;
  };
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
  recipe,
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

    // Recipe-specific Open Graph tags
    if (recipe && type === 'article') {
      if (recipe.ingredients) {
        updateMetaTag('recipe:ingredient', recipe.ingredients.join(', '), true);
      }
      if (recipe.instructions) {
        updateMetaTag('recipe:instruction', recipe.instructions.join(' '), true);
      }
      if (recipe.prepTime) {
        updateMetaTag('recipe:prep_time', `PT${recipe.prepTime}M`, true);
      }
      if (recipe.cookTime) {
        updateMetaTag('recipe:cook_time', `PT${recipe.cookTime}M`, true);
      }
      if (recipe.servings) {
        updateMetaTag('recipe:serves', recipe.servings.toString(), true);
      }
      if (recipe.difficulty) {
        updateMetaTag('recipe:difficulty', recipe.difficulty, true);
      }
      if (recipe.category) {
        updateMetaTag('recipe:category', recipe.category, true);
      }
      if (recipe.tags) {
        updateMetaTag('recipe:tag', recipe.tags.join(', '), true);
      }

      // Article-specific tags
      if (author) {
        updateMetaTag('article:author', author, true);
      }
      if (publishedTime) {
        updateMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime, true);
      }
      updateMetaTag('article:section', 'Recipes', true);
      if (recipe.tags) {
        updateMetaTag('article:tag', recipe.tags.join(', '), true);
      }
    }

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

    const baseStructuredData = {
      "@context": "https://schema.org",
      "@type": type === 'article' && recipe ? 'Recipe' : type === 'article' ? 'Article' : 'WebSite',
      "name": fullTitle,
      "description": description,
      "url": url,
      "image": fullImageUrl,
      "author": {
        "@type": author ? "Person" : "Organization",
        "name": author || "Code Recipe Book"
      },
      ...(publishedTime && { "datePublished": publishedTime }),
      ...(modifiedTime && { "dateModified": modifiedTime }),
      ...(type === 'website' && {
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${typeof window !== 'undefined' ? window.location.origin : ''}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      })
    };

    // Add recipe-specific structured data
    if (recipe && type === 'article') {
      Object.assign(baseStructuredData, {
        ...(recipe.prepTime && { "prepTime": `PT${recipe.prepTime}M` }),
        ...(recipe.cookTime && { "cookTime": `PT${recipe.cookTime}M` }),
        ...(recipe.prepTime && recipe.cookTime && {
          "totalTime": `PT${recipe.prepTime + recipe.cookTime}M`
        }),
        ...(recipe.servings && { "recipeYield": recipe.servings.toString() }),
        ...(recipe.category && { "recipeCategory": recipe.category }),
        ...(recipe.difficulty && { "recipeDifficulty": recipe.difficulty }),
        ...(recipe.ingredients && { "recipeIngredient": recipe.ingredients }),
        ...(recipe.instructions && {
          "recipeInstructions": recipe.instructions.map((step, index) => ({
            "@type": "HowToStep",
            "name": `Step ${index + 1}`,
            "text": step
          }))
        }),
        ...(recipe.tags && { "keywords": recipe.tags.join(', ') }),
        ...(recipe.averageRating && recipe.ratingCount && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": recipe.averageRating,
            "ratingCount": recipe.ratingCount,
            "bestRating": 5,
            "worstRating": 1
          }
        }),
        "nutrition": {
          "@type": "NutritionInformation",
          ...(recipe.servings && { "servingSize": `${recipe.servings} servings` })
        }
      });
    }

    structuredData.textContent = JSON.stringify(baseStructuredData);

  }, [fullTitle, description, keywords, author, fullImageUrl, url, type, publishedTime, modifiedTime, recipe]);

  return null; // This component doesn't render anything visible
};

export default SEOHead;
