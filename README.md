# Comet Studio (DeepSeek V3 Edition)

> **🚀 High-Performance AI Development**: A modern, glassmorphism-inspired AI chat interface powered by DeepSeek V3, featuring real-time streaming, syntax highlighting, and persistent chat sessions.

<p align="center">
    <img src="./screenshot.png" alt="Comet Studio Screenshot" width="800" />
</p>

<p align="center">
    Built with Next.js 15, DeepSeek V3, Tailwind CSS, and Drizzle ORM.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#setup"><strong>Setup</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a>
</p>
<br/>

## Features

### Core Experience
- **DeepSeek V3 Integration**: Powered by the latest DeepSeek models for high-quality code generation.
- **Glassmorphism UI**: A beautiful, modern interface with indigo-purple gradients and backdrop filters.
- **Real-time Streaming**: Watch AI responses generate line-by-line with smooth animations.
- **Syntax Highlighting**: Expertly formatted code blocks with copy-to-clipboard functionality.
- **Session Management**: Persistent chat history stored in PostgreSQL.

### Authentication & Rate Limiting
- **Multi-Level Access**: Support for Anonymous, Guest, and Registered user accounts.
- **Secure Auth**: Powered by NextAuth.js with secure session handling.
- **Smart Rate Limiting**: Tiered message limits based on user type (tracked via IP and User ID).

## Setup

### Environment Variables

Create a `.env` file with the following:

```bash
# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Auth Secret - Generate with: openssl rand -base64 32
AUTH_SECRET=your-auth-secret-here

# Database URL - PostgreSQL connection string
POSTGRES_URL=postgresql://user:password@localhost:5432/comet_db

# Optional: Kimi (Moonshot AI) - Get key at https://platform.moonshot.ai/console/api-keys
MOONSHOT_API_KEY=your_moonshot_api_key_here

# Optional: Kimiclaw (OpenClaw Gateway) - Local assistant with Kimi
OPENCLAW_BASE_URL=http://127.0.0.1:18789/v1
OPENCLAW_GATEWAY_TOKEN=your_gateway_token
# Or use OPENCLAW_GATEWAY_PASSWORD if gateway.auth.mode is "password"

# Optional: One-click Vercel deploy - Get token at https://vercel.com/account/tokens
VERCEL_TOKEN=your_vercel_token
```

### Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. **Generate Schema**:
   ```bash
   pnpm db:generate
   ```

2. **Run Migrations**:
   ```bash
   pnpm db:migrate
   ```

## Getting Started

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting.

### Kimiclaw (OpenClaw) Setup

To use Kimiclaw in Comet Studio, enable the OpenAI-compatible endpoint in your OpenClaw config (`~/.openclaw/openclaw.json`):

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

Then start the gateway (`openclaw gateway`) and set `OPENCLAW_GATEWAY_TOKEN` (or `OPENCLAW_GATEWAY_PASSWORD`) in your `.env`.

## Architecture

### Frontend
- **Zustand**: Global state management for chat sessions and streaming.
- **Lucide React**: Iconography.
- **React Syntax Highlighter**: Beautiful code presentation.

### Backend
- **Next.js API Routes**: Secure communication with AI providers.
- **Drizzle ORM**: Type-safe database interactions.
- **OpenAI SDK**: Used as a compatible client for DeepSeek V3.

---

**Last Updated**: February 2024
**Migration Status**: DeepSeek V3 Migration Complete ✅
