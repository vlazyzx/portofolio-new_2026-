interface ToolIconProps {
  name: string;
}

const BRAND_ICON_MAP: Record<string, string> = {
  react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  nodejs: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  mongodb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
  docker: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  github: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
  vercel: 'https://cdn.simpleicons.org/vercel/000000',
  nginx: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg',
  flask: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
  tailwindcss: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
  mysql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
  postgresql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
  postman: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg',
  figma: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
  git: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
  n8n: 'https://cdn.simpleicons.org/n8n/EA4B71',
  ngrok: 'https://cdn.simpleicons.org/ngrok/1F1E37',
  openapiinitiative: 'https://cdn.simpleicons.org/openapiinitiative/6BA539',
  prisma: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg',
  firebase: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
  linux: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
  ubuntu: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-plain.svg',
};

const ALIAS_MAP: Record<string, string> = {
  'node js': 'nodejs',
  'node.js': 'nodejs',
  node: 'nodejs',
  'mongo db': 'mongodb',
  'tailwind css': 'tailwindcss',
  tailwind: 'tailwindcss',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  'rest api': 'openapiinitiative',
  'rest-api': 'openapiinitiative',
  api: 'openapiinitiative',
  'open api': 'openapiinitiative',
  'openapi': 'openapiinitiative',
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._/]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function getInitials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'NA';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export default function ToolIcon({ name }: ToolIconProps) {
  const normalizedKey = normalizeKey(name);
  const resolvedKey = ALIAS_MAP[normalizedKey] ?? normalizedKey.replace(/\s+/g, '');
  const iconSrc = BRAND_ICON_MAP[resolvedKey] ?? BRAND_ICON_MAP[normalizedKey];

  if (iconSrc) {
    return <img className="tool-ico" src={iconSrc} alt={name} loading="lazy" decoding="async" />;
  }

  return (
    <span className="tool-ico tool-ico-fallback" aria-hidden="true">
      {getInitials(name)}
    </span>
  );
}
