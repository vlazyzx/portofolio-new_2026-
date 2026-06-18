import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/animations.css';
import './styles/typography.css';

const mutedLibraryWarnings = [
  'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.',
  'using deprecated parameters for the initialization function; pass a single object instead'
];

const originalWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const message = String(args[0] ?? '');
  if (mutedLibraryWarnings.some(item => message.includes(item))) return;
  originalWarn(...args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);