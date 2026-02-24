/**
 * Comet Studio Project Templates
 * Full-stack project starters (Replit-style)
 */

export interface ProjectTemplate {
  name: string
  description: string
  mainFile: string
  files: Record<string, string>
}

const SHARED_TAILWIND = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}`

const SHARED_POSTCSS = `module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}`

const SHARED_TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  },
  null,
  2
)

const SHARED_GLOBALS_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`

const SHARED_LAYOUT = `import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}`

const SHARED_NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
module.exports = nextConfig;`

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  'nextjs-starter': {
    name: 'Next.js Starter',
    description: 'Next.js 14 + Tailwind + TypeScript',
    mainFile: 'app/page.tsx',
    files: {
      'package.json': JSON.stringify(
        {
          name: 'my-app',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
          },
          dependencies: {
            next: '14.x',
            react: '^18',
            'react-dom': '^18',
          },
          devDependencies: {
            typescript: '^5',
            tailwindcss: '^3',
            postcss: '^8',
            autoprefixer: '^10',
            '@types/node': '^20',
            '@types/react': '^18',
          },
        },
        null,
        2
      ),
      'tailwind.config.js': SHARED_TAILWIND,
      'postcss.config.js': SHARED_POSTCSS,
      'tsconfig.json': SHARED_TSCONFIG,
      'next.config.js': SHARED_NEXT_CONFIG,
      'app/globals.css': SHARED_GLOBALS_CSS,
      'app/layout.tsx': SHARED_LAYOUT,
      'app/page.tsx': `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Hello from Comets Studio</h1>
      <p className="mt-4 text-slate-600">Start building your app...</p>
    </main>
  );
}`,
    },
  },

  'nextjs-auth': {
    name: 'Next.js with Auth',
    description: 'Next.js + NextAuth.js + login/signup pages',
    mainFile: 'app/page.tsx',
    files: {
      'package.json': JSON.stringify(
        {
          name: 'my-auth-app',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
          },
          dependencies: {
            next: '14.x',
            react: '^18',
            'react-dom': '^18',
            'next-auth': '^4',
          },
          devDependencies: {
            typescript: '^5',
            tailwindcss: '^3',
            postcss: '^8',
            autoprefixer: '^10',
            '@types/node': '^20',
            '@types/react': '^18',
          },
        },
        null,
        2
      ),
      'tailwind.config.js': SHARED_TAILWIND,
      'postcss.config.js': SHARED_POSTCSS,
      'tsconfig.json': SHARED_TSCONFIG,
      'next.config.js': SHARED_NEXT_CONFIG,
      'app/globals.css': SHARED_GLOBALS_CSS,
      'app/layout.tsx': SHARED_LAYOUT,
      'app/page.tsx': `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p className="mt-4 text-slate-600">Sign in to continue.</p>
      <a href="/login" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
        Sign In
      </a>
    </main>
  );
}`,
      'app/api/auth/[...nextauth]/route.ts': `import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.email === 'user@example.com' && credentials?.password === 'password') {
          return { id: '1', email: credentials.email };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: '/login' },
});

export { handler as GET, handler as POST };`,
      'app/login/page.tsx': `'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          signIn('credentials', { email, password, callbackUrl: '/' });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}`,
    },
  },

  'api-only': {
    name: 'API Server',
    description: 'Next.js API routes only, minimal UI',
    mainFile: 'app/api/hello/route.ts',
    files: {
      'package.json': JSON.stringify(
        {
          name: 'my-api',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
          },
          dependencies: { next: '14.x' },
          devDependencies: {
            typescript: '^5',
            '@types/node': '^20',
          },
        },
        null,
        2
      ),
      'tsconfig.json': SHARED_TSCONFIG,
      'next.config.js': SHARED_NEXT_CONFIG,
      'app/layout.tsx': `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>;
}`,
      'app/page.tsx': `export default function Home() {
  return (
    <main className="min-h-screen p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">API Server</h1>
      <p className="text-slate-600">Try <a href="/api/hello" className="text-slate-900 underline">/api/hello</a></p>
    </main>
  );
}`,
      'app/api/hello/route.ts': `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from Comets Studio API!' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}`,
    },
  },

  'nextjs-fullstack': {
    name: 'Full-Stack App',
    description: 'Next.js + Drizzle + CRUD example',
    mainFile: 'app/page.tsx',
    files: {
      'package.json': JSON.stringify(
        {
          name: 'my-fullstack-app',
          version: '0.1.0',
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            'db:generate': 'drizzle-kit generate',
            'db:migrate': 'drizzle-kit migrate',
          },
          dependencies: {
            next: '14.x',
            react: '^18',
            'react-dom': '^18',
            'drizzle-orm': '^0.30',
            postgres: '^3',
          },
          devDependencies: {
            typescript: '^5',
            tailwindcss: '^3',
            postcss: '^8',
            autoprefixer: '^10',
            'drizzle-kit': '^0.20',
            '@types/node': '^20',
            '@types/react': '^18',
          },
        },
        null,
        2
      ),
      'tailwind.config.js': SHARED_TAILWIND,
      'postcss.config.js': SHARED_POSTCSS,
      'tsconfig.json': SHARED_TSCONFIG,
      'next.config.js': SHARED_NEXT_CONFIG,
      'app/globals.css': SHARED_GLOBALS_CSS,
      'app/layout.tsx': SHARED_LAYOUT,
      'drizzle.config.ts': `import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;`,
      'lib/db/schema.ts': `import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});`,
      'lib/db/index.ts': `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });`,
      'app/api/todos/route.ts': `import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';

export async function GET() {
  const allTodos = await db.select().from(todos);
  return NextResponse.json(allTodos);
}

export async function POST(request: Request) {
  const { title } = await request.json();
  const newTodo = await db.insert(todos).values({ title }).returning();
  return NextResponse.json(newTodo[0]);
}`,
      'app/page.tsx': `'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [todos, setTodos] = useState<{ id: number; title: string }[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    fetch('/api/todos').then((r) => r.json()).then(setTodos);
  }, []);

  const addTodo = async () => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTodo }),
    });
    const todo = await res.json();
    setTodos([...todos, todo]);
    setNewTodo('');
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Todo App</h1>
      <div className="flex gap-2 mb-6">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New todo..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={addTodo}
          className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="p-4 bg-white border border-gray-200 rounded-lg">
            {todo.title}
          </li>
        ))}
      </ul>
    </main>
  );
}`,
    },
  },
}

export const PROJECT_TEMPLATE_IDS = Object.keys(PROJECT_TEMPLATES) as (keyof typeof PROJECT_TEMPLATES)[]
