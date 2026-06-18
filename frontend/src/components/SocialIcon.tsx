interface SocialIconProps {
  brand: string;
  className?: string;
}

export default function SocialIcon({ brand, className = 'social-logo' }: SocialIconProps) {
  if (brand === 'instagram') {
    return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="14" width="36" height="36" rx="11"/><circle cx="32" cy="32" r="9"/><circle cx="43" cy="21" r="2.8"/></svg>;
  }
  if (brand === 'github') {
    return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M32 9C19 9 8.8 19.1 8.8 32.2c0 10.3 6.6 19 15.8 22.1 1.2.2 1.7-.5 1.7-1.2v-4.4c-6.4 1.4-7.8-2.7-7.8-2.7-1.1-2.6-2.6-3.4-2.6-3.4-2.1-1.5.2-1.5.2-1.5 2.3.2 3.6 2.4 3.6 2.4 2.1 3.6 5.5 2.5 6.8 1.9.2-1.5.8-2.5 1.5-3.1-5.1-.6-10.5-2.6-10.5-11.5 0-2.6.9-4.7 2.4-6.3-.2-.6-1-3 .3-6.2 0 0 2-.6 6.5 2.4 1.9-.5 3.9-.8 5.9-.8s4 .3 5.9.8c4.5-3 6.5-2.4 6.5-2.4 1.3 3.2.5 5.6.3 6.2 1.5 1.6 2.4 3.7 2.4 6.3 0 8.9-5.4 10.9-10.6 11.5.8.7 1.6 2.2 1.6 4.4v6.4c0 .7.4 1.4 1.7 1.2 9.2-3.1 15.8-11.8 15.8-22.1C55.2 19.1 45 9 32 9Z"/></svg>;
  }
  if (brand === 'roblox') {
    return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8 56 20 44 56 8 44 20 8Z"/><path d="M29 26 39 29 36 39 26 36 29 26Z"/></svg>;
  }
  if (brand === 'discord') {
    return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M22 20c6-2 14-2 20 0l4 6c2 6 3 12 2 18-5 4-10 6-16 6s-11-2-16-6c-1-6 0-12 2-18l4-6Z"/><path d="M24 43c3 2 13 2 16 0"/><circle cx="26" cy="34" r="3"/><circle cx="38" cy="34" r="3"/></svg>;
  }
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true"><path d="M36 10v27.5c0 8.1-6.1 13.5-13.8 13.5C15 51 10 46.4 10 39.8c0-6.7 5.1-11.3 11.6-11.3 1.6 0 3 .3 4.3.9v8.1a5.6 5.6 0 0 0-3.5-1.2c-2.6 0-4.6 1.6-4.6 3.9 0 2.4 1.9 4 4.5 4 2.9 0 5-1.9 5-5.4V10h8.7Zm7 0c1 5.4 4.5 9.4 11 10.5v8.2c-6.1-.2-10.5-2.1-13.6-5.4V10H43Z"/></svg>;
}