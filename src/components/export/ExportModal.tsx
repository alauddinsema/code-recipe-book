import React, { useState } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { ImportExportService } from '../../services/importExport';
import { type Collection } from '../../services/favorites';
import type { Recipe } from '../../types';
import toast from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  collection?: Collection;
  title?: string;
}

type ExportFormat = 'json' | 'pdf';
type ExportType = 'selected' | 'all';

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  recipes,
  collection,
  title = 'Export Recipes'
}) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exportType, setExportType] = useState<ExportType>('all');
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const handleSelectRecipe = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRecipes.size === recipes.length) {
      setSelectedRecipes(new Set());
    } else {
      setSelectedRecipes(new Set(recipes.map(r => r.id)));
    }
  };

  const getRecipesToExport = (): Recipe[] => {
    if (exportType === 'all') {
      return recipes;
    }
    return recipes.filter(recipe => selectedRecipes.has(recipe.id));
  };

  const handleExport = async () => {
    const recipesToExport = getRecipesToExport();
    
    if (recipesToExport.length === 0) {
      toast.error('Please select at least one recipe to export');
      return;
    }

    try {
      setExporting(true);

      if (format === 'json') {
        const jsonData = ImportExportService.exportToJSON(recipesToExport);
        const filename = collection 
          ? `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipes.json`
          : `recipes_${new Date().toISOString().split('T')[0]}.json`;
        
        ImportExportService.downloadFile(jsonData, filename, 'application/json');
        toast.success(`Exported ${recipesToExport.length} recipe${recipesToExport.length !== 1 ? 's' : ''} to JSON`);
      } else {
        if (recipesToExport.length === 1) {
          // Single recipe PDF
          const pdfBlob = await ImportExportService.exportToPDF(recipesToExport[0]);
          const filename = `${recipesToExport[0].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`;
          ImportExportService.downloadFile(pdfBlob, filename, 'application/pdf');
          toast.success('Recipe exported to PDF');
        } else if (collection) {
          // Collection PDF
          const pdfBlob = await ImportExportService.exportCollectionToPDF(collection, recipesToExport);
          const filename = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_collection.pdf`;
          ImportExportService.downloadFile(pdfBlob, filename, 'application/pdf');
          toast.success('Collection exported to PDF');
        } else {
          // Multiple recipes - export each separately
          for (const recipe of recipesToExport) {
            const pdfBlob = await ImportExportService.exportToPDF(recipe);
            const filename = `${recipe.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`;
            ImportExportService.downloadFile(pdfBlob, filename, 'application/pdf');
          }
          toast.success(`Exported ${recipesToExport.length} recipes to PDF`);
        }
      }

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export recipes');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const recipesToExport = getRecipesToExport();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('json')}
                className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                  format === 'json'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <DocumentTextIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">JSON</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Data format</div>
                </div>
                {format === 'json' && (
                  <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 ml-auto" />
                )}
              </button>

              <button
                onClick={() => setFormat('pdf')}
                className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                  format === 'pdf'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <DocumentArrowDownIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">PDF</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Print format</div>
                </div>
                {format === 'pdf' && (
                  <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Recipe Selection */}
          {recipes.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Recipes to Export
              </label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setExportType('all')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        exportType === 'all'
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      All ({recipes.length})
                    </button>
                    <button
                      onClick={() => setExportType('selected')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        exportType === 'selected'
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      Selected ({selectedRecipes.size})
                    </button>
                  </div>
                  
                  {exportType === 'selected' && (
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {selectedRecipes.size === recipes.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {exportType === 'selected' && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                    {recipes.map((recipe) => (
                      <label
                        key={recipe.id}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecipes.has(recipe.id)}
                          onChange={() => handleSelectRecipe(recipe.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {recipe.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {recipe.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Summary</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Format: {format.toUpperCase()}</div>
              <div>Recipes: {recipesToExport.length}</div>
              {collection && <div>Collection: {collection.name}</div>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={handleExport}
              disabled={recipesToExport.length === 0 || exporting}
              className="flex-1 btn-primary"
            >
              {exporting ? 'Exporting...' : `Export ${recipesToExport.length} Recipe${recipesToExport.length !== 1 ? 's' : ''}`}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={exporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
