/**
 * Grok Studio AI Service Layer
 * Powered by xAI Grok models + multi-provider support:
 * - Grok 4.3 (flagship xAI model)
 * - Grok Build 0.1 (elite agentic coding specialist)
 * - Ollama (local)
 * - DeepSeek, Kimi, OpenAI, Claude, Perplexity, Kimiclaw
 *
 * All providers use the OpenAI-compatible SDK interface.
 */

import OpenAI from 'openai';

export type AIProvider = 'grok' | 'grok-build' | 'ollama' | 'kimi' | 'kimiclaw' | 'deepseek' | 'openai' | 'claude' | 'perplexity';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIGenerationMetadata {
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
}

class AIService {
  private ollamaClient: OpenAI | null = null;
  private kimiClient: OpenAI | null = null;
  private kimiclawClient: OpenAI | null = null;
  private deepseekClient: OpenAI | null = null;
  private openaiClient: OpenAI | null = null;
  private perplexityClient: OpenAI | null = null;
  private grokClient: OpenAI | null = null;

  constructor() {
    // Initialize clients lazily to avoid module-level errors
  }

  private getOllamaClient(): OpenAI {
    if (!this.ollamaClient) {
      const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
      this.ollamaClient = new OpenAI({
        baseURL,
        apiKey: 'ollama', // Ollama doesn't require a real key
      });
    }
    return this.ollamaClient;
  }

  private getKimiClient(): OpenAI {
    if (!this.kimiClient) {
      const apiKey = process.env.MOONSHOT_API_KEY || 'sk-placeholder';
      this.kimiClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.moonshot.ai/v1',
      });
    }
    return this.kimiClient;
  }

  /**
   * Kimiclaw via OpenClaw Gateway - OpenAI-compatible endpoint.
   * Requires: openclaw gateway with chatCompletions enabled.
   * Auth: OPENCLAW_GATEWAY_TOKEN or OPENCLAW_GATEWAY_PASSWORD
   */
  private getKimiclawClient(): OpenAI {
    if (!this.kimiclawClient) {
      const baseURL = process.env.OPENCLAW_BASE_URL || process.env.KIMICLAW_BASE_URL || 'http://127.0.0.1:18789/v1';
      const apiKey = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_PASSWORD || 'openclaw';
      this.kimiclawClient = new OpenAI({
        baseURL,
        apiKey,
      });
    }
    return this.kimiclawClient;
  }

  private getDeepSeekClient(): OpenAI {
    if (!this.deepseekClient) {
      const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-placeholder';
      this.deepseekClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com',
      });
    }
    return this.deepseekClient;
  }

  private getOpenAIClient(): OpenAI {
    if (!this.openaiClient) {
      const apiKey = process.env.OPENAI_API_KEY || 'sk-placeholder';
      this.openaiClient = new OpenAI({ apiKey });
    }
    return this.openaiClient;
  }

  private getPerplexityClient(): OpenAI {
    if (!this.perplexityClient) {
      const apiKey = process.env.PERPLEXITY_API_KEY || 'sk-placeholder';
      this.perplexityClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.perplexity.ai',
      });
    }
    return this.perplexityClient;
  }

  /**
   * xAI Grok — Official OpenAI-compatible endpoint.
   * Key: XAI_API_KEY (get at https://console.x.ai)
   * Models: grok-4.3 (smartest), grok-build-0.1 (coding specialist)
   */
  private getGrokClient(): OpenAI {
    if (!this.grokClient) {
      const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || 'sk-placeholder';
      this.grokClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.x.ai/v1',
      });
    }
    return this.grokClient;
  }

  /**
   * Stream a chat completion from the selected AI provider
   */
  async streamChatCompletion(
    messages: AIMessage[],
    options: AIStreamOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const {
      provider = 'grok',
      temperature = 0.7,
      maxTokens = 4096,
      stream = true,
    } = options;

    let client: OpenAI;
    let model: string;

    switch (provider) {
      case 'grok':
        client = this.getGrokClient();
        model = options.model || 'grok-4.3';
        break;
      case 'grok-build':
        client = this.getGrokClient();
        model = options.model || 'grok-build-0.1';
        break;
      case 'ollama':
        client = this.getOllamaClient();
        model = options.model || 'llama3.2';
        break;
      case 'kimi':
        client = this.getKimiClient();
        model = options.model || 'kimi-k2-turbo-preview';
        break;
      case 'kimiclaw':
        client = this.getKimiclawClient();
        model = options.model || 'openclaw:main';
        break;
      case 'perplexity':
        client = this.getPerplexityClient();
        model = options.model || 'llama-3.1-sonar-large-128k-online';
        break;
      case 'openai':
        client = this.getOpenAIClient();
        model = options.model || 'gpt-4-turbo-preview';
        break;
      case 'claude':
        client = this.getOpenAIClient();
        model = options.model || 'claude-3-5-sonnet-20241022';
        break;
      case 'deepseek':
      default:
        client = this.getDeepSeekClient();
        model = options.model || 'deepseek-chat';
        break;
    }

    // Create streaming completion
    const completion = await client.chat.completions.create({
      model,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
      stream,
    });

    // Convert OpenAI stream to ReadableStream
    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion as any) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  /**
   * Generate code with streaming
   */
  async streamCodeGeneration(
    prompt: string,
    context?: string,
    options: AIStreamOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const systemMessage: AIMessage = {
      role: 'system',
      content: `You are Grok, built by xAI — elite coding agent in Grok Studio.

Follow the full GROK_STUDIO_SYSTEM_PROMPT rules exactly:
- shadcn/ui + Radix + Tailwind mastery
- Beautiful, premium dark design with orange accents
- Plan first internally, then perfect production code
- Full TypeScript, modern React, lucide icons, accessible

${context ? `Project Context:\n${context}` : ''}`
    };

    const userMessage: AIMessage = {
      role: 'user',
      content: prompt,
    };

    return this.streamChatCompletion([systemMessage, userMessage], options);
  }

  /**
   * Refactor existing code
   */
  async refactorCode(
    code: string,
    instructions: string,
    options: AIStreamOptions = {}
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are an expert code refactoring assistant. Analyze the code and apply the requested changes while maintaining functionality and improving quality.',
      },
      {
        role: 'user',
        content: `Original Code:\n\`\`\`\n${code}\n\`\`\`\n\nRefactoring Instructions: ${instructions}\n\nProvide the refactored code.`,
      },
    ];

    const client = this.getGrokClient();
    const completion = await client.chat.completions.create({
      model: options.model || 'grok-build-0.1',
      messages: messages as any,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 4096,
    });

    return completion.choices[0]?.message?.content || '';
  }

  /**
   * Generate test cases for code
   */
  async generateTests(
    code: string,
    framework: 'jest' | 'vitest' = 'jest',
    options: AIStreamOptions = {}
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert at writing ${framework} tests. Generate comprehensive unit tests with good coverage.`,
      },
      {
        role: 'user',
        content: `Generate ${framework} tests for this code:\n\`\`\`\n${code}\n\`\`\``,
      },
    ];

    const client = this.getGrokClient();
    const completion = await client.chat.completions.create({
      model: options.model || 'grok-build-0.1',
      messages: messages as any,
      temperature: 0.3,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || '';
  }

  /**
   * Analyze code for improvements
   */
  async analyzeCode(
    code: string,
    analysisType: 'performance' | 'security' | 'accessibility' | 'quality' = 'quality'
  ): Promise<string> {
    const analysisPrompts = {
      performance: 'Analyze this code for performance issues and suggest optimizations (memoization, lazy loading, etc.)',
      security: 'Analyze this code for security vulnerabilities and suggest fixes',
      accessibility: 'Analyze this code for accessibility issues (WCAG compliance) and suggest improvements',
      quality: 'Analyze this code quality, identify code smells, and suggest refactoring opportunities',
    };

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are Grok, an expert code reviewer built by xAI. Be direct, precise and maximally helpful.',
      },
      {
        role: 'user',
        content: `${analysisPrompts[analysisType]}:\n\`\`\`\n${code}\n\`\`\``,
      },
    ];

    const client = this.getGrokClient();
    const completion = await client.chat.completions.create({
      model: 'grok-4.3',
      messages: messages as any,
      temperature: 0.3,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || '';
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
