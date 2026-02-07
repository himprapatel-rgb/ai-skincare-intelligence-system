/**
 * Performance Optimization Utilities
 * Speed up the app with caching, prefetching, and lazy loading
 */

/**
 * Prefetch critical resources
 */
export function prefetchCriticalResources() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
    const criticalUrls = [
      `${apiUrl}/auth/me`,
      `${apiUrl}/shelf`,
      `${apiUrl}/notifications/unread-count`,
    ];

    criticalUrls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  } catch (error) {
    void error;
  }
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px',
  });

  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Debounce function for search/input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll/resize
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Preload critical routes
 */
export function preloadRoutes(routes: string[]) {
  routes.forEach((route) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'script';
    link.href = route;
    document.head.appendChild(link);
  });
}

/**
 * Optimize images (convert to WebP if supported)
 */
export function getOptimizedImageUrl(url: string, width?: number): string {
  if (!url) return url;

  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp')
    .startsWith('data:image/webp');

  if (!supportsWebP) return url;

  // Add query params for optimization
  const separator = url.includes('?') ? '&' : '?';
  const params = [`fm=webp`];
  
  if (width) {
    params.push(`w=${width}`);
    params.push(`q=85`); // Quality
  }

  return `${url}${separator}${params.join('&')}`;
}

/**
 * Monitor Core Web Vitals
 */
export function monitorPerformance() {
  if (typeof window === 'undefined') return;

  // First Contentful Paint
  const observer = new PerformanceObserver((list) => {
    void list;
  });

  try {
    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] });
  } catch (e) {
    // Not supported in all browsers
  }

  // Time to Interactive
  if ('performance' in window && 'timing' in performance) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        const tti = timing.domInteractive - timing.navigationStart;
        void tti;
      }, 0);
    });
  }
}

/**
 * Request idle callback for non-critical tasks
 */
export function runWhenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback?.(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Batch multiple API calls
 */
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  concurrent = 3
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += concurrent) {
    const batch = requests.slice(i, i + concurrent);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Preconnect to API domain
 */
export function preconnectToAPI() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = apiUrl;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    // DNS prefetch as fallback
    const dns = document.createElement('link');
    dns.rel = 'dns-prefetch';
    dns.href = apiUrl;
    document.head.appendChild(dns);
  } catch (error) {
    void error;
  }
}

/**
 * Detect slow network and adjust behavior
 */
export function isSlowNetwork(): boolean {
  const legacyNavigator = navigator as Navigator & {
    connection?: { effectiveType?: string };
    mozConnection?: { effectiveType?: string };
    webkitConnection?: { effectiveType?: string };
  };
  const connection = legacyNavigator.connection ||
                     legacyNavigator.mozConnection ||
                     legacyNavigator.webkitConnection;

  if (!connection) return false;

  const slowTypes = ['slow-2g', '2g'];
  return slowTypes.includes(connection.effectiveType);
}

/**
 * Show loading indicator after delay (prevents flash)
 */
export function showLoadingWithDelay(
  setLoading: (value: boolean) => void,
  delay = 300
): () => void {
  const timeout = setTimeout(() => setLoading(true), delay);
  
  return () => {
    clearTimeout(timeout);
    setLoading(false);
  };
}
