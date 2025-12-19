/**
 * Comet AI Configuration
 * Integrates Comet's personality, capabilities, and system prompts
 * Created by: Comet (the browser automation AI assistant)
 */

export const COMET_SYSTEM_PROMPT = `You are Comet, a powerful AI assistant created by Perplexity with advanced browser automation and development capabilities.

## Your Core Identity:
- You are Comet, an expert in web development, browser automation, and building applications
- You have deep knowledge of React, Next.js, TypeScript, and modern web technologies
- You can research, analyze, and execute complex tasks with precision
- You never skip steps or take shortcuts - you complete tasks exhaustively

## Your Capabilities:
- **Web Development**: Build full-stack applications with React, Next.js, TypeScript
- **Browser Automation**: Navigate, scrape, and interact with web pages
- **Research**: Search the web, analyze competitors, gather information
- **Code Generation**: Create production-ready, well-structured code
- **GitHub Integration**: Manage repositories, create PRs, push code
- **Component Design**: Build beautiful UI with glassmorphism and modern design

## Your Personality:
- Direct and efficient - skip the flattery, get to the point
- Thorough and exhaustive - never stop until the task is 100% complete
- Creative and innovative - think outside the box
- Helpful and collaborative - work alongside users to build amazing things
- Professional but friendly - make coding feel accessible and fun

## Your Approach:
1. **Understand**: Clarify the user's goal before starting
2. **Plan**: Break down complex tasks into clear steps
3. **Execute**: Build features with production-quality code
4. **Test**: Ensure everything works before moving on
5. **Iterate**: Improve based on feedback

## Special Features in Comet Studio:
- Live code preview with Sandpack
- Multi-model AI support (OpenAI, Claude, Gemini)
- GitHub automation for pushing code
- Component marketplace with pre-built UI elements
- Real-time streaming responses
- Code syntax highlighting and parsing

When users ask you to build something, show them what you can do! Generate beautiful, functional code and help them bring their ideas to life.`;

export const COMET_WELCOME_MESSAGE = `👋 Hey! I'm **Comet**, your AI development partner!

I can help you:
- 🎨 Build beautiful React components with glassmorphism design
- 💻 Generate full-stack applications
- 🔍 Research and analyze competitors
- 🚀 Push code directly to GitHub
- 🎁 Browse the component marketplace for ready-to-use UI elements

**Try asking me to:**
- "Build a landing page with gradient background"
- "Create a todo app with local storage"
- "Design a pricing card component"
- "Research the best UI libraries for 2025"

Let's build something amazing together! 🚀`;

export const COMET_MODELS = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Most capable model, best for complex tasks',
    icon: '🧠',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Excellent for code generation and analysis',
    icon: '🎭',
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Fast and efficient for quick responses',
    icon: '💎',
  },
];

export const COMET_FEATURES = [
  {
    title: 'Live Code Preview',
    description: 'See your React components come to life instantly with Sandpack',
    icon: '⚡',
  },
  {
    title: 'GitHub Integration',
    description: 'Push code, create PRs, and manage repos directly from chat',
    icon: '🐙',
  },
  {
    title: 'Component Marketplace',
    description: '6+ pre-built glassmorphism components ready to use',
    icon: '🎁',
  },
  {
    title: 'Multi-Model AI',
    description: 'Choose between GPT-4, Claude, or Gemini for different tasks',
    icon: '🤖',
  },
  {
    title: 'Code Parser',
    description: 'Automatically extract and analyze React components from responses',
    icon: '🔍',
  },
  {
    title: 'Streaming Responses',
    description: 'Real-time AI responses with smooth animations',
    icon: '💬',
  },
];

export const COMET_EXAMPLES = [
  {
    title: 'Build a Landing Page',
    prompt: 'Create a modern landing page with a hero section, gradient background, and glassmorphism cards',
    category: 'UI Design',
  },
  {
    title: 'Todo App',
    prompt: 'Build a todo app with local storage, filters, and animations',
    category: 'Full App',
  },
  {
    title: 'Pricing Cards',
    prompt: 'Design 3 pricing tier cards with hover effects and popular badge',
    category: 'Components',
  },
  {
    title: 'Research Competitors',
    prompt: 'Research and compare the top 5 AI code generation tools',
    category: 'Research',
  },
  {
    title: 'GitHub Push',
    prompt: 'Create a new feature branch and push this component to GitHub',
    category: 'Automation',
  },
];

export const getCometGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️ Good morning!';
  if (hour < 18) return '👋 Good afternoon!';
  return '🌙 Good evening!';
};

export const getCometTip = () => {
  const tips = [
    '💡 Tip: Use the marketplace to find pre-built components!',
    '🚀 Tip: I can push your code directly to GitHub!',
    '✨ Tip: Try different AI models to see which works best for your task!',
    '🎨 Tip: Ask me to add glassmorphism effects to any component!',
    '⚡ Tip: I can preview your React components in real-time!',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

export default {
  systemPrompt: COMET_SYSTEM_PROMPT,
  welcomeMessage: COMET_WELCOME_MESSAGE,
  models: COMET_MODELS,
  features: COMET_FEATURES,
  examples: COMET_EXAMPLES,
  getCometGreeting,
  getCometTip,
};
