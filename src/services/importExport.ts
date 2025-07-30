import { jsPDF } from 'jspdf';
import type { Recipe, RecipeFormData } from '../types';
import type { Collection } from './favorites';
import { RecipeService } from './recipes';

export interface ImportResult {
  success: Recipe[];
  failed: { data: any; error: string }[];
  total: number;
}

export interface RecipeImportData {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  code_snippet?: string;
  language?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  tags?: string[];
  image_url?: string;
}

export class ImportExportService {
  // JSON Import
  static async importFromJSON(file: File, userId: string, userName?: string): Promise<ImportResult> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Handle both single recipe and array of recipes
      const recipes = Array.isArray(data) ? data : [data];
      const result: ImportResult = {
        success: [],
        failed: [],
        total: recipes.length
      };

      for (const recipeData of recipes) {
        try {
          const validatedRecipe = this.validateRecipeData(recipeData);
          const savedRecipe = await RecipeService.createRecipe(validatedRecipe, userId, userName);
          result.success.push(savedRecipe);
        } catch (error) {
          result.failed.push({
            data: recipeData,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // URL Import (Recipe Scraping)
  static async importFromURL(url: string, userId: string, userName?: string): Promise<Recipe> {
    try {
      // For now, we'll use a simple approach. In production, you'd want a more robust scraping service
      const response = await fetch(`/.netlify/functions/scrape-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to scrape recipe from URL');
      }

      const recipeData = await response.json();
      const validatedRecipe = this.validateRecipeData(recipeData);
      return await RecipeService.createRecipe(validatedRecipe, userId, userName);
    } catch (error) {
      throw new Error(`Failed to import recipe from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate and sanitize recipe data
  private static validateRecipeData(data: any): RecipeFormData {
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Recipe must have a valid title');
    }

    if (!data.description || typeof data.description !== 'string') {
      throw new Error('Recipe must have a valid description');
    }

    if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
      throw new Error('Recipe must have at least one ingredient');
    }

    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      throw new Error('Recipe must have at least one step');
    }

    return {
      title: data.title.trim(),
      description: data.description.trim(),
      ingredients: data.ingredients.filter((ing: any) => typeof ing === 'string' && ing.trim()),
      steps: data.steps.filter((step: any) => typeof step === 'string' && step.trim()),
      code_snippet: data.code_snippet || undefined,
      language: data.language || undefined,
      difficulty: ['easy', 'medium', 'hard'].includes(data.difficulty) ? data.difficulty : undefined,
      category: data.category || undefined,
      prep_time: typeof data.prep_time === 'number' && data.prep_time > 0 ? data.prep_time : undefined,
      cook_time: typeof data.cook_time === 'number' && data.cook_time > 0 ? data.cook_time : undefined,
      servings: typeof data.servings === 'number' && data.servings > 0 ? data.servings : undefined,
      tags: Array.isArray(data.tags) ? data.tags.filter((tag: any) => typeof tag === 'string') : undefined,
      image_url: data.image_url || undefined
    };
  }

  // JSON Export
  static exportToJSON(recipes: Recipe[]): string {
    const exportData = recipes.map(recipe => ({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      code_snippet: recipe.code_snippet,
      language: recipe.language,
      difficulty: recipe.difficulty,
      category: recipe.category,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      tags: recipe.tags,
      image_url: recipe.image_url,
      author_name: recipe.author_name,
      created_at: recipe.created_at
    }));

    return JSON.stringify(exportData, null, 2);
  }

  // PDF Export for single recipe
  static async exportToPDF(recipe: Recipe): Promise<Blob> {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * (fontSize * 0.4));
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    yPosition = addWrappedText(recipe.title, margin, yPosition, contentWidth, 20);
    yPosition += 10;

    // Description
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(recipe.description, margin, yPosition, contentWidth);
    yPosition += 10;

    // Recipe info
    if (recipe.prep_time || recipe.cook_time || recipe.servings) {
      const info = [];
      if (recipe.prep_time) info.push(`Prep: ${recipe.prep_time}m`);
      if (recipe.cook_time) info.push(`Cook: ${recipe.cook_time}m`);
      if (recipe.servings) info.push(`Serves: ${recipe.servings}`);
      if (recipe.difficulty) info.push(`Difficulty: ${recipe.difficulty}`);
      
      yPosition = addWrappedText(info.join(' • '), margin, yPosition, contentWidth);
      yPosition += 15;
    }

    // Ingredients
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    yPosition = addWrappedText('Ingredients', margin, yPosition, contentWidth, 16);
    yPosition += 5;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    recipe.ingredients.forEach((ingredient, _index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      yPosition = addWrappedText(`• ${ingredient}`, margin, yPosition, contentWidth);
      yPosition += 2;
    });
    yPosition += 10;

    // Instructions
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    yPosition = addWrappedText('Instructions', margin, yPosition, contentWidth, 16);
    yPosition += 5;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    recipe.steps.forEach((step, index) => {
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 20;
      }
      yPosition = addWrappedText(`${index + 1}. ${step}`, margin, yPosition, contentWidth);
      yPosition += 5;
    });

    // Code snippet
    if (recipe.code_snippet) {
      yPosition += 10;
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      yPosition = addWrappedText('Code Snippet', margin, yPosition, contentWidth, 16);
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont('courier', 'normal');
      yPosition = addWrappedText(recipe.code_snippet, margin, yPosition, contentWidth, 10);
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Generated by Code Recipe Book - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    return pdf.output('blob');
  }

  // PDF Export for collection
  static async exportCollectionToPDF(collection: Collection, recipes: Recipe[]): Promise<Blob> {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Collection title page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(collection.name, pageWidth / 2, 50, { align: 'center' });

    if (collection.description) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(collection.description, contentWidth);
      pdf.text(lines, pageWidth / 2, 80, { align: 'center' });
    }

    pdf.setFontSize(12);
    pdf.text(`${recipes.length} recipes`, pageWidth / 2, 120, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 140, { align: 'center' });

    // Table of contents
    pdf.addPage();
    yPosition = 30;
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', margin, yPosition);
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    recipes.forEach((recipe, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 30;
      }
      pdf.text(`${index + 1}. ${recipe.title}`, margin, yPosition);
      yPosition += 8;
    });

    // Add each recipe
    for (let i = 0; i < recipes.length; i++) {
      pdf.addPage();
      // Note: This is a simplified approach. In a real implementation,
      // you'd want to properly merge the PDFs or recreate the content
      await this.exportToPDF(recipes[i]);
    }

    return pdf.output('blob');
  }

  // Download helper
  static downloadFile(content: string | Blob, filename: string, mimeType: string = 'application/json') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
