import type { Recipe } from '../types';
import type { Collection } from './favorites';
import toast from 'react-hot-toast';

export interface ShareData {
  title: string;
  text: string;
  url: string;
  image?: string;
}

export interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  shareUrl: (data: ShareData) => string;
}

export class SocialSharingService {
  // Social media platforms configuration
  static readonly platforms: Record<string, SocialPlatform> = {
    facebook: {
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      shareUrl: (data) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`
    },
    twitter: {
      name: 'Twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      shareUrl: (data) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}`
    },
    linkedin: {
      name: 'LinkedIn',
      icon: 'linkedin',
      color: '#0A66C2',
      shareUrl: (data) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`
    },
    pinterest: {
      name: 'Pinterest',
      icon: 'pinterest',
      color: '#E60023',
      shareUrl: (data) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(data.url)}&description=${encodeURIComponent(data.text)}${data.image ? `&media=${encodeURIComponent(data.image)}` : ''}`
    },
    whatsapp: {
      name: 'WhatsApp',
      icon: 'whatsapp',
      color: '#25D366',
      shareUrl: (data) => `https://wa.me/?text=${encodeURIComponent(`${data.text} ${data.url}`)}`
    },
    telegram: {
      name: 'Telegram',
      icon: 'telegram',
      color: '#0088CC',
      shareUrl: (data) => `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}`
    },
    reddit: {
      name: 'Reddit',
      icon: 'reddit',
      color: '#FF4500',
      shareUrl: (data) => `https://reddit.com/submit?url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}`
    },
    email: {
      name: 'Email',
      icon: 'email',
      color: '#6B7280',
      shareUrl: (data) => `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`${data.text}\n\n${data.url}`)}`
    }
  };

  // Share a recipe
  static async shareRecipe(recipe: Recipe, platform?: string): Promise<void> {
    const shareData = this.getRecipeShareData(recipe);
    
    if (platform) {
      this.shareOnPlatform(platform, shareData);
    } else {
      await this.nativeShare(shareData);
    }
  }

  // Share a collection
  static async shareCollection(collection: Collection, platform?: string): Promise<void> {
    const shareData = this.getCollectionShareData(collection);
    
    if (platform) {
      this.shareOnPlatform(platform, shareData);
    } else {
      await this.nativeShare(shareData);
    }
  }

  // Generate recipe share data
  static getRecipeShareData(recipe: Recipe): ShareData {
    const url = `${window.location.origin}/recipe/${recipe.id}`;
    const title = `${recipe.title} - Code Recipe Book`;
    const text = `Check out this amazing recipe: ${recipe.title}! ${recipe.description}`;
    
    return {
      title,
      text,
      url,
      image: recipe.image_url
    };
  }

  // Generate collection share data
  static getCollectionShareData(collection: Collection): ShareData {
    const url = `${window.location.origin}/collections/${collection.id}`;
    const title = `${collection.name} - Recipe Collection`;
    const text = collection.description 
      ? `Check out this recipe collection: ${collection.name}! ${collection.description}`
      : `Check out this recipe collection: ${collection.name}`;
    
    return {
      title,
      text,
      url
    };
  }

  // Native sharing (Web Share API)
  static async nativeShare(data: ShareData): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Native sharing failed:', error);
          await this.fallbackShare(data);
        }
      }
    } else {
      await this.fallbackShare(data);
    }
  }

  // Share on specific platform
  static shareOnPlatform(platformKey: string, data: ShareData): void {
    const platform = this.platforms[platformKey];
    if (!platform) {
      console.error(`Unknown platform: ${platformKey}`);
      return;
    }

    const shareUrl = platform.shareUrl(data);
    
    // Open in new window for better UX
    const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes';
    window.open(shareUrl, '_blank', windowFeatures);
  }

  // Fallback sharing (copy to clipboard)
  static async fallbackShare(data: ShareData): Promise<void> {
    try {
      const shareText = `${data.title}\n\n${data.text}\n\n${data.url}`;
      await navigator.clipboard.writeText(shareText);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      toast.error('Failed to copy share link');
    }
  }

  // Copy link to clipboard
  static async copyLink(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      toast.error('Failed to copy link');
    }
  }

  // Generate Open Graph meta tags for a recipe
  static getRecipeOpenGraphTags(recipe: Recipe): Record<string, string> {
    const url = `${window.location.origin}/recipe/${recipe.id}`;
    const title = `${recipe.title} - Code Recipe Book`;
    const description = recipe.description;
    const image = recipe.image_url || `${window.location.origin}/og-recipe-default.jpg`;

    return {
      'og:title': title,
      'og:description': description,
      'og:type': 'article',
      'og:url': url,
      'og:image': image,
      'og:site_name': 'Code Recipe Book',
      'article:author': recipe.author_name || '',
      'article:published_time': recipe.created_at,
      'article:modified_time': recipe.updated_at,
      'article:section': 'Recipes',
      'article:tag': recipe.tags?.join(', ') || '',
      // Recipe-specific Open Graph
      'recipe:ingredient': recipe.ingredients.join(', '),
      'recipe:instruction': recipe.steps.join(' '),
      'recipe:prep_time': recipe.prep_time ? `PT${recipe.prep_time}M` : '',
      'recipe:cook_time': recipe.cook_time ? `PT${recipe.cook_time}M` : '',
      'recipe:serves': recipe.servings?.toString() || '',
      'recipe:difficulty': recipe.difficulty || '',
      'recipe:category': recipe.category || ''
    };
  }

  // Generate structured data for a recipe
  static getRecipeStructuredData(recipe: Recipe): object {
    const baseUrl = window.location.origin;
    
    return {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.title,
      "description": recipe.description,
      "image": recipe.image_url ? [recipe.image_url] : [],
      "author": {
        "@type": "Person",
        "name": recipe.author_name
      },
      "datePublished": recipe.created_at,
      "dateModified": recipe.updated_at,
      "prepTime": recipe.prep_time ? `PT${recipe.prep_time}M` : undefined,
      "cookTime": recipe.cook_time ? `PT${recipe.cook_time}M` : undefined,
      "totalTime": recipe.prep_time && recipe.cook_time ? `PT${recipe.prep_time + recipe.cook_time}M` : undefined,
      "recipeYield": recipe.servings?.toString(),
      "recipeCategory": recipe.category,
      "recipeCuisine": "International",
      "keywords": recipe.tags?.join(', '),
      "recipeIngredient": recipe.ingredients,
      "recipeInstructions": recipe.steps.map((step, index) => ({
        "@type": "HowToStep",
        "name": `Step ${index + 1}`,
        "text": step
      })),
      "nutrition": {
        "@type": "NutritionInformation",
        "servingSize": recipe.servings ? `${recipe.servings} servings` : undefined
      },
      "aggregateRating": recipe.average_rating && recipe.rating_count ? {
        "@type": "AggregateRating",
        "ratingValue": recipe.average_rating,
        "ratingCount": recipe.rating_count,
        "bestRating": 5,
        "worstRating": 1
      } : undefined,
      "url": `${baseUrl}/recipe/${recipe.id}`,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${baseUrl}/recipe/${recipe.id}`
      }
    };
  }

  // Check if native sharing is supported
  static isNativeSharingSupported(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  // Check if clipboard API is supported
  static isClipboardSupported(): boolean {
    return typeof navigator !== 'undefined' && 'clipboard' in navigator;
  }

  // Get popular platforms for mobile/desktop
  static getPopularPlatforms(isMobile: boolean = false): string[] {
    if (isMobile) {
      return ['whatsapp', 'telegram', 'twitter', 'facebook', 'email'];
    }
    return ['twitter', 'facebook', 'linkedin', 'pinterest', 'reddit', 'email'];
  }
}
