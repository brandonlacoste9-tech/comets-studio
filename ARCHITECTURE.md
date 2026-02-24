# Comets Studio Architecture

## Overview
AI-powered component and app builder. Local-first (Ollama), multi-provider AI, project templates, live preview, deploy, export.

## Core Flow
1. **Chat** → User describes component/app
2. **AI** → Generates code (streaming)
3. **Preview** → Sandpack with Tailwind
4. **Deploy/Export** → Vercel or ZIP

## Key Modules

| Module | Purpose |
|--------|---------|
| `lib/ai-service.ts` | Multi-provider AI (Ollama, DeepSeek, Kimi, etc.) |
| `lib/stores/chat-store.ts` | Chat state, sessions, projectFiles |
| `lib/project-templates.ts` | Full project starters |
| `lib/vercel-deploy.ts` | Build, deploy, export |
| `lib/templates.ts` | Component snippets |
| `components/code-playground/` | Sandpack + FileTree |
| `components/chat/` | Chat UI, templates, explain |

## APIs
- `POST /api/chat` – Streaming chat (auth, rate limit)
- `POST /api/explain` – Code explanation
- `POST /api/deploy` – Vercel deploy
- `POST /api/export` – ZIP (Replit-ready)

## Project Mode
When `projectFiles` exists: FileTree sidebar, multi-file editing, debounced sync to message.
