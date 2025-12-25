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
