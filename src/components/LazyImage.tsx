import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

const LazyImage = ({ src, alt, fallback, className, ...props }: LazyImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // Use IntersectionObserver for true lazy loading
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        },
        { rootMargin: '200px' }
      );
      obs.observe(el);
      return () => obs.disconnect();
    } else {
      setInView(true);
    }
  }, []);

  return (
    <>
      {/* Placeholder div with same dimensions */}
      {!loaded && !error && (
        <div
          ref={!inView ? imgRef : undefined}
          className={`bg-muted animate-pulse ${className || ''}`}
          style={props.style}
        />
      )}
      {inView && (
        <img
          ref={inView && !loaded ? imgRef : undefined}
          src={error && fallback ? fallback : src}
          alt={alt}
          className={`${className || ''} ${loaded ? '' : 'sr-only'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </>
  );
};

export default LazyImage;
