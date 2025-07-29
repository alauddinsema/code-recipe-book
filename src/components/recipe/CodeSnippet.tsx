import React, { useState } from 'react';

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = 'text', title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      python: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      typescript: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      java: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      cpp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'c++': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      go: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      rust: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      php: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      ruby: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      swift: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      kotlin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };
    return colors[lang.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          {title && (
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h4>
          )}
          {language && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLanguageColor(language)}`}>
              {language.toUpperCase()}
            </span>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-500 transition-colors duration-200"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
          <code className="language-{language}">{code}</code>
        </pre>
        
        {/* Line numbers for longer code */}
        {code.split('\n').length > 5 && (
          <div className="absolute left-0 top-0 p-4 text-xs text-gray-400 dark:text-gray-500 select-none pointer-events-none">
            {code.split('\n').map((_, index) => (
              <div key={index} className="leading-5">
                {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippet;
