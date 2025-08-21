import { useState, useEffect, useRef } from 'react';

type IntersectionObserverOptions = {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
};

function useIntersectionObserver(options: IntersectionObserverOptions): [React.RefObject<any>, boolean] {
  const [isIntersecting, setIntersecting] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return [ref, isIntersecting];
}

export default useIntersectionObserver;
