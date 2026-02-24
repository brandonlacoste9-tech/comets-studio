/**
 * Ollama model presets for Comet Studio
 * 100% local — no API keys, no cloud costs, data stays on your machine.
 *
 * Pull models: ollama pull deepseek-coder && ollama pull llama3.2 && ...
 */

export const OLLAMA_MODELS = {
  code: 'deepseek-coder', // Code generation, React components
  chat: 'llama3.2',       // General chat
  fast: 'mistral',        // Quick responses
  smart: 'qwen2.5',       // Complex reasoning
  vision: 'llava',        // Image analysis
} as const

export type OllamaTaskType = keyof typeof OLLAMA_MODELS

export const OLLAMA_MODEL_LABELS: Record<OllamaTaskType, string> = {
  code: 'Code (deepseek-coder)',
  chat: 'Chat (llama3.2)',
  fast: 'Fast (mistral)',
  smart: 'Smart (qwen2.5)',
  vision: 'Vision (llava)',
}
