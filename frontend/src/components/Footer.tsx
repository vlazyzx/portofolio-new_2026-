import './Footer.css';

interface FooterProps {
  compact?: boolean;
}

export default function Footer({ compact = false }: FooterProps) {
  return (
    <footer className={compact ? 'footer compact' : 'footer'}>
      <div className="fc">2025 Muhammad Ikhsan - Indonesia</div>
      <div className="fc">Portofolio React + Vite + TypeScript</div>
    </footer>
  );
}