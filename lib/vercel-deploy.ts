/**
 * Build a minimal Next.js project from component code and deploy to Vercel
 */

const PACKAGE_JSON = `{
  "name": "comets-deploy",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5"
  }
}`

const NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
module.exports = nextConfig;`

const POSTCSS_CONFIG = `module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};`

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};`

const LAYOUT = `import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}`

const GLOBALS_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`

const TSCONFIG = JSON.stringify({
  compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] } },
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules'],
}, null, 2)

/** Replit config - enables import to Replit */
const REPLIT_CONFIG = `run = "npm run dev"
entrypoint = "app/page.tsx"
modules = ["nodejs-22"]

[nix]
channel = "stable-24_11"

[deployment]
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 3000
externalPort = 80
`

function toBase64(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64')
}

/**
 * Build project files from component code.
 * User code is used as app/page.tsx (must export default)
 */
export function buildProjectFiles(code: string): Array<{ file: string; data: string; encoding: 'base64' }> {
  const pageCode = code.trim()
  const raw = buildProjectFilesRaw(pageCode)
  return raw.map(({ file, content }) => ({ file, data: toBase64(content), encoding: 'base64' as const }))
}

/** Raw file contents for ZIP export (Replit-ready) */
export function buildProjectFilesRaw(code: string): Array<{ file: string; content: string }> {
  return [
    { file: 'package.json', content: PACKAGE_JSON },
    { file: 'next.config.js', content: NEXT_CONFIG },
    { file: 'postcss.config.js', content: POSTCSS_CONFIG },
    { file: 'tailwind.config.js', content: TAILWIND_CONFIG },
    { file: 'app/layout.tsx', content: LAYOUT },
    { file: 'app/page.tsx', content: code },
    { file: 'app/globals.css', content: GLOBALS_CSS },
    { file: 'tsconfig.json', content: TSCONFIG },
    { file: '.replit', content: REPLIT_CONFIG },
  ]
}

/** Build project files from template (full project) */
export function buildProjectFilesFromTemplate(files: Record<string, string>): Array<{ file: string; data: string; encoding: 'base64' }> {
  const withReplit = { ...files, '.replit': REPLIT_CONFIG }
  return Object.entries(withReplit).map(([file, content]) => ({
    file,
    data: toBase64(content),
    encoding: 'base64' as const,
  }))
}

/** Raw file contents from template for ZIP export */
export function buildProjectFilesRawFromTemplate(files: Record<string, string>): Array<{ file: string; content: string }> {
  const withReplit = { ...files, '.replit': REPLIT_CONFIG }
  return Object.entries(withReplit).map(([file, content]) => ({ file, content }))
}

export interface DeployResult {
  url: string
  id: string
  status: string
}

export async function deployToVercel(
  code: string,
  projectName?: string
): Promise<DeployResult> {
  const files = buildProjectFiles(code)
  return deployToVercelFromFiles(files, projectName)
}

export async function deployToVercelFromTemplate(
  templateFiles: Record<string, string>,
  projectName?: string
): Promise<DeployResult> {
  const files = buildProjectFilesFromTemplate(templateFiles)
  return deployToVercelFromFiles(files, projectName)
}

async function deployToVercelFromFiles(
  files: Array<{ file: string; data: string; encoding: 'base64' }>,
  projectName?: string
): Promise<DeployResult> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    throw new Error('VERCEL_TOKEN is not set. Add it to your .env file.')
  }

  const name = projectName || `comets-${Date.now().toString(36)}`

  const response = await fetch('https://api.vercel.com/v13/deployments?skipAutoDetectionConfirmation=1', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      files,
      projectSettings: {
        framework: 'nextjs',
        buildCommand: 'next build',
        installCommand: 'npm install',
      },
      target: 'production',
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Vercel API error: ${response.status}`)
  }

  const data = await response.json()
  const deploymentUrl = data.url?.startsWith('http') ? data.url : data.url ? `https://${data.url}` : null
  const aliasUrl = data.alias?.[0] ? `https://${data.alias[0]}` : null

  return {
    url: aliasUrl || deploymentUrl || `https://${data.name}.vercel.app`,
    id: data.id,
    status: data.readyState || data.status,
  }
}
