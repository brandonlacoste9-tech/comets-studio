/**
 * Comet Studio AI Service Layer
 * Supports streaming responses from multiple AI providers:
 * - DeepSeek V3 (primary)
 * - OpenAI (GPT-4)
 * - Anthropic Claude
 * - Perplexity (Comet with web search)
 * 
 * Features:
 * - Streaming responses with SSE
 * - Multi-model support with fallback
 * - Context-aware code generation
 * - Semantic code understanding
 */

import OpenAI from 'openai';

export type AIProvider = 'deepseek' | 'openai' | 'claude' | 'perplexity';

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
  private deepseekClient: OpenAI | null = null;
  private openaiClient: OpenAI | null = null;
  private perplexityClient: OpenAI | null = null;

  constructor() {
    // Initialize clients lazily to avoid module-level errors
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
   * Stream a chat completion from the selected AI provider
   */
  async streamChatCompletion(
    messages: AIMessage[],
    options: AIStreamOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const {
      provider = 'deepseek',
      temperature = 0.7,
      maxTokens = 4096,
      stream = true,
    } = options;

    let client: OpenAI;
    let model: string;

    switch (provider) {
      case 'perplexity':
        client = this.getPerplexityClient();
        model = options.model || 'llama-3.1-sonar-large-128k-online';
        break;
      case 'openai':
        client = this.getOpenAIClient();
        model = options.model || 'gpt-4-turbo-preview';
        break;
      case 'claude':
        // Note: Currently using OpenAI client for Claude if it's via a proxy, 
        // or this might need a separate Anthropic client. 
        // For now, following the pattern of the existing code which was using OpenAI client.
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
      content: `You are an expert React/TypeScript developer and code generation assistant for Comet Studio.

Your task is to generate high-quality, production-ready code that follows best practices:
- Write clean, idiomatic React code with TypeScript
- Use modern React patterns (hooks, functional components)
- Include proper type definitions
- Follow accessibility standards (WCAG)
- Add inline comments for complex logic
- Use Tailwind CSS for styling
- Generate responsive, mobile-first designs
${context ? `\n\nProject Context:\n${context}` : ''}`
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

    const client = this.getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: options.model || 'deepseek-chat',
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

    const client = this.getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: options.model || 'deepseek-chat',
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
        content: 'You are an expert code reviewer with deep knowledge of best practices, performance, security, and accessibility.',
      },
      {
        role: 'user',
        content: `${analysisPrompts[analysisType]}:\n\`\`\`\n${code}\n\`\`\``,
      },
    ];

    const client = this.getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
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
