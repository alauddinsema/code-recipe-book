/**
 * Comprehensive Debug Tool for Code Recipe Book
 * Detects and reports various types of loading and runtime issues
 */

interface DebugReport {
  timestamp: string;
  environment: EnvironmentInfo;
  performance: PerformanceInfo;
  errors: ErrorInfo[];
  warnings: WarningInfo[];
  network: NetworkInfo;
  dependencies: DependencyInfo;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface EnvironmentInfo {
  nodeEnv: string;
  isDev: boolean;
  isProd: boolean;
  userAgent: string;
  viewport: { width: number; height: number };
  connection: any;
  supabaseConfig: {
    url: string | null;
    keyPresent: boolean;
    isValid: boolean;
  };
  geminiConfig: {
    keyPresent: boolean;
    isValid: boolean;
  };
}

interface PerformanceInfo {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  memoryUsage: any;
  resourceCount: number;
  slowResources: Array<{ name: string; duration: number }>;
}

interface ErrorInfo {
  type: 'javascript' | 'network' | 'console' | 'component' | 'api';
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface WarningInfo {
  type: 'performance' | 'accessibility' | 'security' | 'deprecation';
  message: string;
  recommendation: string;
  timestamp: number;
}

interface NetworkInfo {
  failedRequests: Array<{ url: string; status: number; error: string }>;
  slowRequests: Array<{ url: string; duration: number }>;
  totalRequests: number;
  averageResponseTime: number;
}

interface DependencyInfo {
  react: string;
  reactRouter: string;
  supabase: string;
  missing: string[];
  outdated: string[];
}

class DebugTool {
  private errors: ErrorInfo[] = [];
  private warnings: WarningInfo[] = [];
  private networkRequests: Array<{ url: string; startTime: number; endTime?: number; status?: number; error?: string }> = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    
    // Capture JavaScript errors
    window.addEventListener('error', (event) => {
      this.addError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        severity: this.determineSeverity(event.message)
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        severity: 'high'
      });
    });

    // Monitor console errors
    this.interceptConsole();

    // Monitor network requests
    this.interceptFetch();
    this.interceptXHR();

    // Monitor React errors (if React DevTools is available)
    this.monitorReactErrors();

    this.isInitialized = true;
  }

  private determineSeverity(message: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['supabase', 'authentication', 'database', 'api key', 'network error'];
    const highKeywords = ['component', 'render', 'hook', 'state'];
    const mediumKeywords = ['warning', 'deprecated', 'performance'];

    const lowerMessage = message.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) return 'critical';
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) return 'high';
    if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) return 'medium';
    
    return 'low';
  }

  private addError(error: ErrorInfo) {
    // Limit the number of errors to prevent memory issues
    if (this.errors.length >= 1000) {
      this.errors = this.errors.slice(-500); // Keep only the last 500 errors
    }
    this.errors.push(error);
    // Use a simple log instead of console.error to prevent infinite loops
    if (import.meta.env.DEV) {
      console.log('🐛 Debug Tool - Error captured:', error.message);
    }
  }

  private addWarning(warning: WarningInfo) {
    // Limit the number of warnings to prevent memory issues
    if (this.warnings.length >= 500) {
      this.warnings = this.warnings.slice(-250); // Keep only the last 250 warnings
    }
    this.warnings.push(warning);
    if (import.meta.env.DEV) {
      console.log('⚠️ Debug Tool - Warning captured:', warning.message);
    }
  }

  private interceptConsole() {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      // Prevent infinite loops by checking if this is our own debug message
      const message = args.join(' ');
      if (!message.includes('🐛 Debug Tool') && !message.includes('Debug Tool - Error captured')) {
        this.addError({
          type: 'console',
          message,
          timestamp: Date.now(),
          severity: this.determineSeverity(message)
        });
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (!message.includes('⚠️ Debug Tool') && !message.includes('Debug Tool - Warning captured')) {
        this.addWarning({
          type: 'performance',
          message,
          recommendation: 'Check console for details',
          timestamp: Date.now()
        });
      }
      originalWarn.apply(console, args);
    };
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      const request = { url, startTime };
      this.networkRequests.push(request);

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        Object.assign(request, { endTime, status: response.status });
        
        if (!response.ok) {
          this.addError({
            type: 'network',
            message: `HTTP ${response.status}: ${url}`,
            timestamp: Date.now(),
            severity: response.status >= 500 ? 'critical' : 'high'
          });
        }
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        Object.assign(request, { endTime, error: error.message });
        
        this.addError({
          type: 'network',
          message: `Network error: ${url} - ${error.message}`,
          timestamp: Date.now(),
          severity: 'critical'
        });
        
        throw error;
      }
    };
  }

  private interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._debugUrl = url;
      this._debugStartTime = Date.now();
      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('loadend', () => {
        const endTime = Date.now();
        const duration = endTime - this._debugStartTime;
        
        if (this.status >= 400) {
          debugTool.addError({
            type: 'network',
            message: `XHR ${this.status}: ${this._debugUrl}`,
            timestamp: Date.now(),
            severity: this.status >= 500 ? 'critical' : 'high'
          });
        }
      });
      
      return originalSend.call(this, ...args);
    };
  }

  private monitorReactErrors() {
    // This would integrate with React Error Boundaries
    // For now, we'll check for React-specific errors in the console
  }

  public async generateReport(): Promise<DebugReport> {
    const environment = await this.getEnvironmentInfo();
    const performance = await this.getPerformanceInfo();
    const network = this.getNetworkInfo();
    const dependencies = await this.getDependencyInfo();
    const recommendations = this.generateRecommendations();
    const severity = this.calculateOverallSeverity();

    return {
      timestamp: new Date().toISOString(),
      environment,
      performance,
      errors: this.errors,
      warnings: this.warnings,
      network,
      dependencies,
      recommendations,
      severity
    };
  }

  private async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    return {
      nodeEnv: import.meta.env.NODE_ENV || 'development',
      isDev: import.meta.env.DEV || false,
      isProd: import.meta.env.PROD || false,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection || null,
      supabaseConfig: {
        url: import.meta.env.VITE_SUPABASE_URL || null,
        keyPresent: !!(import.meta.env.VITE_SUPABASE_ANON_KEY),
        isValid: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
      },
      geminiConfig: {
        keyPresent: !!(import.meta.env.VITE_GEMINI_API_KEY),
        isValid: !!(import.meta.env.VITE_GEMINI_API_KEY)
      }
    };
  }

  private async getPerformanceInfo(): Promise<PerformanceInfo> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || null;
    const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || null;

    const slowResources = resources
      .filter(resource => resource.duration > 1000)
      .map(resource => ({ name: resource.name, duration: resource.duration }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      loadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart || 0,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      memoryUsage: (performance as any).memory || null,
      resourceCount: resources.length,
      slowResources
    };
  }

  private getNetworkInfo(): NetworkInfo {
    const failedRequests = this.networkRequests
      .filter(req => req.error || (req.status && req.status >= 400))
      .map(req => ({
        url: req.url,
        status: req.status || 0,
        error: req.error || `HTTP ${req.status}`
      }));

    const slowRequests = this.networkRequests
      .filter(req => req.endTime && (req.endTime - req.startTime) > 2000)
      .map(req => ({
        url: req.url,
        duration: req.endTime! - req.startTime
      }));

    const completedRequests = this.networkRequests.filter(req => req.endTime);
    const averageResponseTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => sum + (req.endTime! - req.startTime), 0) / completedRequests.length
      : 0;

    return {
      failedRequests,
      slowRequests,
      totalRequests: this.networkRequests.length,
      averageResponseTime
    };
  }

  private async getDependencyInfo(): Promise<DependencyInfo> {
    // This would ideally check package.json, but we'll use what's available
    return {
      react: '19.1.0', // From package.json
      reactRouter: '7.7.1',
      supabase: '2.53.0',
      missing: [],
      outdated: []
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Environment recommendations
    if (!import.meta.env.VITE_SUPABASE_URL) {
      recommendations.push('Set VITE_SUPABASE_URL environment variable');
    }
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      recommendations.push('Set VITE_SUPABASE_ANON_KEY environment variable');
    }

    // Performance recommendations
    const slowResources = this.networkRequests.filter(req => 
      req.endTime && (req.endTime - req.startTime) > 2000
    );
    if (slowResources.length > 0) {
      recommendations.push('Optimize slow network requests');
    }

    // Error recommendations
    const criticalErrors = this.errors.filter(error => error.severity === 'critical');
    if (criticalErrors.length > 0) {
      recommendations.push('Fix critical errors immediately');
    }

    return recommendations;
  }

  private calculateOverallSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = this.errors.filter(error => error.severity === 'critical');
    const highErrors = this.errors.filter(error => error.severity === 'high');

    if (criticalErrors.length > 0) return 'critical';
    if (highErrors.length > 2) return 'high';
    if (this.errors.length > 5) return 'medium';
    return 'low';
  }

  public clearLogs() {
    this.errors = [];
    this.warnings = [];
    this.networkRequests = [];
  }

  public exportReport(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }
}

// Create global instance
export const debugTool = new DebugTool();

// Export for manual debugging
(window as any).debugTool = debugTool;
