import { useEffect } from 'react';
import type { PageId } from '../types/portfolio';

const motionSelectorMap: Record<PageId, string> = {
  home: '.ey',
  about: '.ey, .bio, .tl-item, .sb2',
  projects: '.project-filter, .pj',
  student: '.student-profile, .student-column, .ach, .cr',
  contact: '.contact-copy, .ch, .social-panel, .social-icon, .social-card, .fb',
  admin: ''
};

interface MotionLayerProps {
  page: PageId;
}

const cleanupReveal = (element: HTMLElement, delayMs: number) => {
  window.setTimeout(() => {
    element.classList.remove('rb-reveal', 'is-visible');
    element.style.removeProperty('--rb-delay');
  }, delayMs + 780);
};

export default function MotionLayer({ page }: MotionLayerProps) {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const selectors = motionSelectorMap[page];
    if (!selectors) return undefined;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors));

    elements.forEach((element, index) => {
      const delayMs = Math.min(index * 28, 360);
      element.classList.remove('rb-reveal', 'is-visible');
      element.classList.add('rb-reveal');
      element.style.setProperty('--rb-delay', `${delayMs}ms`);

      if (index < 4) {
        element.classList.add('is-visible');
        cleanupReveal(element, delayMs);
      }
    });

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const delay = parseFloat(element.style.getPropertyValue('--rb-delay')) || 0;
            element.classList.add('is-visible');
            cleanupReveal(element, delay);
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    elements.slice(4).forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [page]);

  return null;
}
