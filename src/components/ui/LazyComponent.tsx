import React from 'react';
import { useLazyComponent, useLazyComponentWithDelay, useProgressiveLazyLoading } from '../../hooks/useLazyComponent';

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  progressive?: boolean;
  stages?: number[];
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = null,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  delay = 0,
  progressive = false,
  stages = [0, 300, 600]
}) => {
  // Choose the appropriate hook based on props
  const lazyHook = progressive
    ? useProgressiveLazyLoading(stages, { threshold, rootMargin, triggerOnce })
    : delay > 0
    ? useLazyComponentWithDelay(delay, { threshold, rootMargin, triggerOnce })
    : useLazyComponent({ threshold, rootMargin, triggerOnce });

  const { ref, isVisible } = lazyHook;

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Specialized lazy components for common use cases
export const LazyRecipeCard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}> = ({ children, fallback, className = '' }) => (
  <LazyComponent
    threshold={0.1}
    rootMargin="100px"
    triggerOnce={true}
    className={className}
    fallback={fallback}
  >
    {children}
  </LazyComponent>
);

export const LazySection: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, fallback, className = '', delay = 200 }) => (
  <LazyComponent
    threshold={0.2}
    rootMargin="50px"
    triggerOnce={true}
    delay={delay}
    className={className}
    fallback={fallback}
  >
    {children}
  </LazyComponent>
);

export const ProgressiveLazySection: React.FC<{
  children: React.ReactNode;
  className?: string;
  stages?: number[];
}> = ({ children, className = '', stages = [0, 200, 400] }) => {
  const { ref, isStageVisible } = useProgressiveLazyLoading(stages);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      <div 
        className={`transition-opacity duration-300 ${
          isStageVisible(0) ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {isStageVisible(0) && (
          <div 
            className={`transition-transform duration-500 ${
              isStageVisible(1) ? 'translate-y-0' : 'translate-y-4'
            }`}
          >
            {isStageVisible(1) && (
              <div 
                className={`transition-all duration-700 ${
                  isStageVisible(2) ? 'scale-100' : 'scale-95'
                }`}
              >
                {children}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LazyComponent;
