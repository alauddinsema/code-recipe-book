import React, { useState } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowUpIcon, 
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button, MobileInput } from '../ui';
import { ImportExportService, type ImportResult } from '../../services/importExport';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [importing, setImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast.error('Please sign in to import recipes');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    try {
      setImporting(true);
      const result = await ImportExportService.importFromJSON(
        file, 
        user.id, 
        user.user_metadata?.full_name || user.email
      );
      
      setImportResult(result);
      onImportComplete?.(result);
      
      if (result.success.length > 0) {
        toast.success(`Successfully imported ${result.success.length} recipe${result.success.length !== 1 ? 's' : ''}`);
      }
      
      if (result.failed.length > 0) {
        toast.error(`Failed to import ${result.failed.length} recipe${result.failed.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import recipes');
    } finally {
      setImporting(false);
    }
  };

  const handleUrlImport = async () => {
    if (!user) {
      toast.error('Please sign in to import recipes');
      return;
    }

    if (!importUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      setImporting(true);
      const recipe = await ImportExportService.importFromURL(
        importUrl.trim(),
        user.id,
        user.user_metadata?.full_name || user.email
      );
      
      const result: ImportResult = {
        success: [recipe],
        failed: [],
        total: 1
      };
      
      setImportResult(result);
      onImportComplete?.(result);
      toast.success('Recipe imported successfully from URL');
      setImportUrl('');
    } catch (error) {
      console.error('URL import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import recipe from URL');
    } finally {
      setImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.toLowerCase().endsWith('.json'));
    
    if (jsonFile) {
      handleFileUpload(jsonFile);
    } else {
      toast.error('Please drop a JSON file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setImportUrl('');
    setActiveTab('file');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Import Recipes
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {importResult ? (
            /* Import Results */
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Import Complete
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {importResult.success.length} of {importResult.total} recipes imported successfully
                </p>
              </div>

              {importResult.success.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Successfully Imported ({importResult.success.length})
                  </h4>
                  <ul className="space-y-1">
                    {importResult.success.slice(0, 5).map((recipe, index) => (
                      <li key={index} className="text-sm text-green-700 dark:text-green-300">
                        • {recipe.title}
                      </li>
                    ))}
                    {importResult.success.length > 5 && (
                      <li className="text-sm text-green-600 dark:text-green-400">
                        ... and {importResult.success.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {importResult.failed.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    Failed to Import ({importResult.failed.length})
                  </h4>
                  <ul className="space-y-1">
                    {importResult.failed.slice(0, 3).map((failed, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300">
                        • {failed.data.title || 'Unknown recipe'}: {failed.error}
                      </li>
                    ))}
                    {importResult.failed.length > 3 && (
                      <li className="text-sm text-red-600 dark:text-red-400">
                        ... and {importResult.failed.length - 3} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-center space-x-3">
                <Button onClick={handleClose} className="btn-primary">
                  Done
                </Button>
                <Button 
                  onClick={() => setImportResult(null)} 
                  variant="outline"
                >
                  Import More
                </Button>
              </div>
            </div>
          ) : (
            /* Import Interface */
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'file'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => setActiveTab('url')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'url'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Import from URL</span>
                </button>
              </div>

              {activeTab === 'file' ? (
                /* File Upload */
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragOver
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Upload JSON File
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Drag and drop your JSON file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={importing}
                    />
                    <label
                      htmlFor="file-upload"
                      className="btn-primary cursor-pointer inline-block"
                    >
                      {importing ? 'Importing...' : 'Choose File'}
                    </label>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">JSON Format Expected:</p>
                        <p>Upload a JSON file containing recipe data. The file can contain a single recipe object or an array of recipes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* URL Import */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipe URL
                    </label>
                    <MobileInput
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://example.com/recipe"
                      disabled={importing}
                    />
                  </div>

                  <Button
                    onClick={handleUrlImport}
                    disabled={!importUrl.trim() || importing}
                    className="w-full btn-primary"
                  >
                    {importing ? 'Importing...' : 'Import Recipe'}
                  </Button>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <p className="font-medium mb-1">URL Import Notes:</p>
                        <p>This feature works best with recipe websites that use structured data. Some sites may not be supported.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
