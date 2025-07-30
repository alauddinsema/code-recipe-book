/**
 * Simple Debug Tool for Code Recipe Book
 * A lightweight debugging utility that provides essential diagnostics
 */

interface DebugInfo {
  timestamp: string;
  environment: {
    isDev: boolean;
    supabaseConfigured: boolean;
    geminiConfigured: boolean;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    solution?: string;
  }>;
  performance: {
    loadTime: number;
    resourceCount: number;
  };
}

class SimpleDebugTool {
  private issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    solution?: string;
  }> = [];

  constructor() {
    this.init();
  }

  private init() {
    // Monitor for common issues
    this.checkEnvironment();
    this.monitorConsoleErrors();
    this.checkPerformance();
  }

  private checkEnvironment() {
    // Check Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      this.addIssue('error', 'Missing VITE_SUPABASE_URL environment variable', 'Add VITE_SUPABASE_URL to your .env file');
    }
    
    if (!supabaseKey) {
      this.addIssue('error', 'Missing VITE_SUPABASE_ANON_KEY environment variable', 'Add VITE_SUPABASE_ANON_KEY to your .env file');
    }

    // Check Gemini API
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      this.addIssue('warning', 'Missing VITE_GEMINI_API_KEY environment variable', 'Add VITE_GEMINI_API_KEY to your .env file for AI features');
    }

    // Check if we're in development mode
    if (import.meta.env.DEV) {
      this.addIssue('info', 'Running in development mode', 'This is normal for local development');
    }
  }

  private monitorConsoleErrors() {
    const originalError = console.error;
    
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Check for specific known issues
      if (message.includes('Invalid API key')) {
        this.addIssue('error', 'Supabase API key is invalid or expired', 'Check your Supabase project settings and update the VITE_SUPABASE_ANON_KEY');
      } else if (message.includes('AuthSessionMissingError')) {
        this.addIssue('info', 'User not authenticated', 'This is normal for public pages');
      } else if (message.includes('Failed to fetch')) {
        this.addIssue('error', 'Network request failed', 'Check your internet connection and API endpoints');
      } else if (!message.includes('🐛 Debug Tool')) {
        // Only log non-debug tool errors
        this.addIssue('error', `Console error: ${message}`, 'Check the browser console for more details');
      }
      
      originalError.apply(console, args);
    };
  }

  private checkPerformance() {
    // Simple performance check
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation?.loadEventEnd - navigation?.navigationStart;
      
      if (loadTime > 3000) {
        this.addIssue('warning', `Slow page load time: ${Math.round(loadTime)}ms`, 'Consider optimizing images and reducing bundle size');
      }
      
      const resourceCount = performance.getEntriesByType('resource').length;
      if (resourceCount > 50) {
        this.addIssue('warning', `High resource count: ${resourceCount} resources`, 'Consider bundling or lazy loading resources');
      }
    });
  }

  private addIssue(type: 'error' | 'warning' | 'info', message: string, solution?: string) {
    // Prevent duplicates
    const exists = this.issues.some(issue => issue.message === message);
    if (!exists) {
      this.issues.push({ type, message, solution });
    }
  }

  public getDebugInfo(): DebugInfo {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation ? navigation.loadEventEnd - navigation.navigationStart : 0;
    const resourceCount = performance.getEntriesByType('resource').length;

    return {
      timestamp: new Date().toISOString(),
      environment: {
        isDev: import.meta.env.DEV || false,
        supabaseConfigured: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
        geminiConfigured: !!import.meta.env.VITE_GEMINI_API_KEY
      },
      issues: this.issues,
      performance: {
        loadTime: Math.round(loadTime),
        resourceCount
      }
    };
  }

  public printDebugInfo() {
    const info = this.getDebugInfo();
    
    console.group('🔍 Debug Information');
    console.log('📊 Environment:', info.environment);
    console.log('⚡ Performance:', info.performance);
    
    if (info.issues.length > 0) {
      console.group('🚨 Issues Found:');
      info.issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} ${issue.message}`);
        if (issue.solution) {
          console.log(`   💡 Solution: ${issue.solution}`);
        }
      });
      console.groupEnd();
    } else {
      console.log('✅ No issues detected!');
    }
    
    console.groupEnd();
  }

  public getIssuesSummary(): string {
    const info = this.getDebugInfo();
    const errorCount = info.issues.filter(i => i.type === 'error').length;
    const warningCount = info.issues.filter(i => i.type === 'warning').length;
    
    if (errorCount > 0) {
      return `${errorCount} error(s), ${warningCount} warning(s)`;
    } else if (warningCount > 0) {
      return `${warningCount} warning(s)`;
    } else {
      return 'No issues detected';
    }
  }

  public clearIssues() {
    this.issues = [];
  }
}

// Create global instance
export const simpleDebugTool = new SimpleDebugTool();

// Export for manual debugging
(window as any).debugInfo = () => simpleDebugTool.printDebugInfo();
(window as any).simpleDebugTool = simpleDebugTool;

// Auto-print debug info in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    simpleDebugTool.printDebugInfo();
  }, 2000);
}
