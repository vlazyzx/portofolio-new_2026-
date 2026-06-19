import { createElement, useEffect, useMemo, useRef, useState, type ElementType, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

type SplitUnit = 'chars' | 'words' | 'lines' | 'words, chars';

type SplitTextProps = {
  tag?: ElementType;
  text?: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: SplitUnit;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
};

type Segment = {
  key: string;
  value: string;
  isSpace?: boolean;
};

function splitIntoChars(text: string): Segment[] {
  return Array.from(text).map((char, index) => ({
    key: `char-${index}-${char}`,
    value: char,
    isSpace: char === ' ',
  }));
}

function splitIntoWords(text: string): Segment[] {
  return text.split(/(\s+)/).map((part, index) => ({
    key: `word-${index}-${part}`,
    value: part,
    isSpace: /^\s+$/.test(part),
  }));
}

export default function SplitText({
  text = '',
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const animationCompletedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, text]);

  const segments = useMemo(() => {
    if (splitType.includes('words')) return splitIntoWords(text);
    return splitIntoChars(text);
  }, [splitType, text]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !isVisible || animationCompletedRef.current) return;

      const targets = el.querySelectorAll<HTMLElement>('[data-split-item="true"]');
      if (!targets.length) return;

      gsap.set(targets, from);
      gsap.to(targets, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        onComplete: () => {
          animationCompletedRef.current = true;
          onLetterAnimationComplete?.();
        },
        willChange: 'transform, opacity',
        force3D: true,
      });
    },
    {
      dependencies: [text, className, delay, duration, ease, splitType, isVisible, JSON.stringify(from), JSON.stringify(to)],
      scope: ref,
    }
  );

  const Tag = tag || 'p';

  return createElement(
    Tag,
    {
      ref,
      style: {
        textAlign,
        overflow: 'hidden',
        display: 'inline-block',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        willChange: 'transform, opacity',
      },
      className: `split-parent ${className}`.trim(),
    },
    segments.map(segment => (
      segment.isSpace ? (
        <span key={segment.key} aria-hidden="true">{segment.value}</span>
      ) : (
        <span
          key={segment.key}
          data-split-item="true"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          aria-hidden="true"
        >
          {segment.value}
        </span>
      )
    ))
  );
}
