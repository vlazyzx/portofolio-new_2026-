import { useEffect } from 'react';
import type { PageId } from '../types/portfolio';

const motionSelectors = [
  '.ey', '.stt', '.bio', '.tl-item', '.sb2',
  '.project-filter', '.pj', '.student-profile', '.student-column',
  '.ach', '.cr', '.contact-copy', '.ch', '.social-panel',
  '.social-icon', '.social-card', '.fb'
].join(',');

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
    const elements = Array.from(document.querySelectorAll<HTMLElement>(motionSelectors));

    elements.forEach((element, index) => {
      const delayMs = Math.min(index * 28, 360);
      element.classList.remove('rb-reveal', 'is-visible');
      element.classList.add('rb-reveal');
      element.style.setProperty('--rb-delay', `${delayMs}ms`);
      if (reduceMotion) {
        element.classList.remove('rb-reveal');
        element.style.removeProperty('--rb-delay');
      }
    });

    if (reduceMotion) return undefined;

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

    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [page]);

  return null;
}