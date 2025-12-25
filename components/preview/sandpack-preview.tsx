'use client';

import { Sandpack } from '@codesandbox/sandpack-react';
import { useSettings } from '@/lib/store/settings';

const files = {
  '/App.tsx': `export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4", padding: "20px" }}>
      <h1>🚀 Comet Artiste Preview</h1>
      <p>Your AI-generated apps will run here instantly.</p>
    </div>
  );
}`,
};

export function SandpackPreview({ code }: { code?: string }) {
  const { artisteMode } = useSettings();

  if (!artisteMode) return null;

  const customFiles = code ? { '/App.tsx': code } : files;

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-slate-950">
      <Sandpack
        template="react-ts"
        theme="dark"
        files={customFiles}
        options={{
          showNavigator: true,
          showLineNumbers: true,
          showInlineErrors: true,
          editorHeight: '100%',
        }}
        customSetup={{
          dependencies: {
            "lucide-react": "latest",
            "framer-motion": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest"
          }
        }}
      />
    </div>
  );
}
