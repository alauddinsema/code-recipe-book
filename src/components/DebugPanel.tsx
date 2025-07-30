import React, { useState, useEffect } from 'react';
import { debugTool } from '../utils/debugTool';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['errors']));
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(generateReport, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const newReport = await debugTool.generateReport();
      setReport(newReport);
    } catch (error) {
      console.error('Failed to generate debug report:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyReport = () => {
    if (report) {
      navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      alert('Debug report copied to clipboard!');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Debug Panel
            </h2>
            {report && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                {report.severity.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                autoRefresh 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={generateReport}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={copyReport}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && !report && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Generating report...</span>
            </div>
          )}

          {report && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Errors:</span>
                    <span className="ml-2 font-medium text-red-600">{report.errors.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Warnings:</span>
                    <span className="ml-2 font-medium text-yellow-600">{report.warnings.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Load Time:</span>
                    <span className="ml-2 font-medium">{Math.round(report.performance.loadTime)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Network:</span>
                    <span className="ml-2 font-medium">{report.network.totalRequests} requests</span>
                  </div>
                </div>
              </div>

              {/* Environment */}
              <DebugSection
                title="Environment"
                isExpanded={expandedSections.has('environment')}
                onToggle={() => toggleSection('environment')}
              >
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Mode:</span>
                      <span className="ml-2">{report.environment.isDev ? 'Development' : 'Production'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Viewport:</span>
                      <span className="ml-2">{report.environment.viewport.width}x{report.environment.viewport.height}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Supabase:</span>
                    <span className={`ml-2 ${report.environment.supabaseConfig.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {report.environment.supabaseConfig.isValid ? 'Configured' : 'Missing/Invalid'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Gemini API:</span>
                    <span className={`ml-2 ${report.environment.geminiConfig.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {report.environment.geminiConfig.isValid ? 'Configured' : 'Missing/Invalid'}
                    </span>
                  </div>
                </div>
              </DebugSection>

              {/* Errors */}
              <DebugSection
                title={`Errors (${report.errors.length})`}
                isExpanded={expandedSections.has('errors')}
                onToggle={() => toggleSection('errors')}
                severity={report.errors.length > 0 ? 'high' : 'low'}
              >
                {report.errors.length === 0 ? (
                  <p className="text-green-600 text-sm">No errors detected! 🎉</p>
                ) : (
                  <div className="space-y-2">
                    {report.errors.map((error: any, index: number) => (
                      <div key={index} className={`p-3 rounded border-l-4 ${
                        error.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                        error.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                        'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {getSeverityIcon(error.severity)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{error.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {error.type} • {new Date(error.timestamp).toLocaleTimeString()}
                            </p>
                            {error.stack && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-500 cursor-pointer">Stack trace</summary>
                                <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">{error.stack}</pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DebugSection>

              {/* Performance */}
              <DebugSection
                title="Performance"
                isExpanded={expandedSections.has('performance')}
                onToggle={() => toggleSection('performance')}
              >
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Load Time:</span>
                      <span className="ml-2">{Math.round(report.performance.loadTime)}ms</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">DOM Ready:</span>
                      <span className="ml-2">{Math.round(report.performance.domContentLoaded)}ms</span>
                    </div>
                  </div>
                  {report.performance.slowResources.length > 0 && (
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Slow Resources:</p>
                      {report.performance.slowResources.slice(0, 5).map((resource: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                          {resource.name.split('/').pop()} - {Math.round(resource.duration)}ms
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DebugSection>

              {/* Network */}
              <DebugSection
                title={`Network (${report.network.totalRequests} requests)`}
                isExpanded={expandedSections.has('network')}
                onToggle={() => toggleSection('network')}
                severity={report.network.failedRequests.length > 0 ? 'high' : 'low'}
              >
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Average Response Time:</span>
                    <span className="ml-2">{Math.round(report.network.averageResponseTime)}ms</span>
                  </div>
                  {report.network.failedRequests.length > 0 && (
                    <div>
                      <p className="text-red-600 font-medium mb-2">Failed Requests:</p>
                      {report.network.failedRequests.map((req: any, index: number) => (
                        <div key={index} className="text-xs text-red-600">
                          {req.status} - {req.url}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DebugSection>

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <DebugSection
                  title={`Recommendations (${report.recommendations.length})`}
                  isExpanded={expandedSections.has('recommendations')}
                  onToggle={() => toggleSection('recommendations')}
                >
                  <ul className="space-y-1 text-sm">
                    {report.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </DebugSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface DebugSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const DebugSection: React.FC<DebugSectionProps> = ({ 
  title, 
  children, 
  isExpanded, 
  onToggle, 
  severity 
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        <div className="flex items-center space-x-2">
          {severity && (
            <span className={`w-2 h-2 rounded-full ${
              severity === 'critical' ? 'bg-red-500' :
              severity === 'high' ? 'bg-orange-500' :
              severity === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`} />
          )}
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
