import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { RecipeImporterService, type RecipeImportResult, type RecipeImportStatus } from '../../services/recipeImporter';
import { useAuth } from '../../hooks/useAuth';
import type { Recipe } from '../../types';

interface RecipeImporterProps {
  onRecipeImported?: (recipe: Recipe) => void;
  onClose?: () => void;
}

interface ImportProgress {
  importId: string;
  status: RecipeImportStatus;
  startTime: number;
}

const RecipeImporter: React.FC<RecipeImporterProps> = ({ onRecipeImported, onClose }) => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedDomains, setSupportedDomains] = useState<string[]>([]);

  useEffect(() => {
    // Load supported domains
    RecipeImporterService.getSupportedDomains().then(setSupportedDomains);
  }, []);

  useEffect(() => {
    // Poll for import progress
    if (importProgress && importProgress.status.status !== 'completed' && importProgress.status.status !== 'failed') {
      const pollInterval = setInterval(async () => {
        const status = await RecipeImporterService.getImportStatus(importProgress.importId);
        if (status) {
          setImportProgress(prev => prev ? { ...prev, status } : null);
          
          if (status.status === 'completed' && status.recipe_id) {
            // Import completed successfully
            clearInterval(pollInterval);
            setIsImporting(false);
            
            // Fetch the completed recipe
            try {
              const { RecipeService } = await import('../../services/recipes');
              const recipe = await RecipeService.getRecipeById(status.recipe_id);
              onRecipeImported?.(recipe);
            } catch (err) {
              console.error('Failed to fetch imported recipe:', err);
            }
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsImporting(false);
            setError(status.error_message || 'Import failed');
          }
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [importProgress, onRecipeImported]);

  const handleImport = async () => {
    if (!user || !url.trim()) return;

    // Validate URL
    if (!RecipeImporterService.isValidRecipeUrl(url)) {
      setError('Please enter a valid recipe URL (must start with http:// or https://)');
      return;
    }

    setError(null);
    setIsImporting(true);
    setImportProgress(null);

    try {
      const result: RecipeImportResult = await RecipeImporterService.importRecipeFromUrl({
        url: url.trim(),
        userId: user.id,
        userName: user.name
      });

      if (result.success && result.recipe) {
        // Direct success (synchronous import)
        setIsImporting(false);
        onRecipeImported?.(result.recipe);
      } else if (result.importId) {
        // Asynchronous import - start polling
        const status = await RecipeImporterService.getImportStatus(result.importId);
        if (status) {
          setImportProgress({
            importId: result.importId,
            status,
            startTime: Date.now()
          });
        }
      } else {
        throw new Error(result.error || 'Import failed');
      }

    } catch (err) {
      setIsImporting(false);
      setError(err instanceof Error ? err.message : 'Failed to import recipe');
    }
  };

  const handleCancel = () => {
    setIsImporting(false);
    setImportProgress(null);
    setError(null);
    onClose?.();
  };

  const getProgressPercentage = () => {
    if (!importProgress) return 0;
    return importProgress.status.progress || 0;
  };

  const getElapsedTime = () => {
    if (!importProgress) return 0;
    return Math.floor((Date.now() - importProgress.startTime) / 1000);
  };

  const isDomainSupported = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return supportedDomains.includes(domain);
    } catch {
      return false;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Import Recipe</h2>
        {onClose && (
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isImporting}
            aria-label="Close recipe importer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {!isImporting && !importProgress ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="recipe-url" className="block text-sm font-medium text-gray-700 mb-2">
              Recipe URL
            </label>
            <input
              id="recipe-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isImporting}
            />
            {url && !RecipeImporterService.isValidRecipeUrl(url) && (
              <p className="text-sm text-red-600 mt-1">Please enter a valid URL</p>
            )}
            {url && RecipeImporterService.isValidRecipeUrl(url) && !isDomainSupported(url) && (
              <p className="text-sm text-yellow-600 mt-1">
                ⚠️ This domain may not be fully supported. Import may require manual review.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Supported Sites</h3>
            <div className="text-xs text-blue-600 space-y-1">
              <p>✅ AllRecipes, Food Network, Epicurious</p>
              <p>✅ Bon Appétit, Serious Eats, Tasty</p>
              <p>✅ Food.com, Yummly, Delish</p>
              <p className="text-blue-500">+ Many other recipe websites</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleImport}
              disabled={!url.trim() || !RecipeImporterService.isValidRecipeUrl(url) || isImporting}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import Recipe
            </Button>
            {onClose && (
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isImporting}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Recipe</h3>
            <p className="text-sm text-gray-600 mb-4">
              {importProgress?.status.message || 'Processing your recipe...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{getProgressPercentage()}% complete</span>
            <span>{getElapsedTime()}s elapsed</span>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-600">
              <strong>URL:</strong> {url}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={handleCancel}
            className="w-full"
            disabled={importProgress?.status.status === 'completed'}
          >
            Cancel Import
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecipeImporter;
