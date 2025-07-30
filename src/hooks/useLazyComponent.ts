import { useState, useEffect, useRef } from 'react';

interface UseLazyComponentOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading components based on intersection observer
 * @param options - Configuration options for intersection observer
 * @returns Object with ref to attach to element and isVisible state
 */
export const useLazyComponent = (options: UseLazyComponentOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If already triggered and triggerOnce is true, don't observe again
    if (hasTriggered && triggerOnce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasTriggered(true);
          
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    ref: elementRef,
    isVisible: isVisible || hasTriggered
  };
};

/**
 * Hook for lazy loading with delay
 * @param delay - Delay in milliseconds before showing content
 * @param options - Intersection observer options
 * @returns Object with ref and isVisible state
 */
export const useLazyComponentWithDelay = (
  delay: number = 0,
  options: UseLazyComponentOptions = {}
) => {
  const { ref, isVisible: isIntersecting } = useLazyComponent(options);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isIntersecting && delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    } else if (isIntersecting) {
      setIsVisible(true);
    }
  }, [isIntersecting, delay]);

  return {
    ref,
    isVisible: delay > 0 ? isVisible : isIntersecting
  };
};

/**
 * Hook for progressive loading of content
 * @param stages - Array of delays for each stage
 * @param options - Intersection observer options
 * @returns Object with ref and current stage
 */
export const useProgressiveLazyLoading = (
  stages: number[] = [0, 500, 1000],
  options: UseLazyComponentOptions = {}
) => {
  const { ref, isVisible: isIntersecting } = useLazyComponent(options);
  const [currentStage, setCurrentStage] = useState(-1);

  useEffect(() => {
    if (!isIntersecting) return;

    stages.forEach((delay, index) => {
      setTimeout(() => {
        setCurrentStage(index);
      }, delay);
    });
  }, [isIntersecting, stages]);

  return {
    ref,
    currentStage,
    isVisible: isIntersecting,
    isStageVisible: (stage: number) => currentStage >= stage
  };
};

export default useLazyComponent;
