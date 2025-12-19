/**
 * Utility to parse and extract code blocks from AI-generated responses
 */

export interface CodeBlock {
  code: string
  language: 'tsx' | 'jsx' | 'typescript' | 'javascript' | 'html' | 'css'
  hasReactComponent: boolean
  componentName?: string
}

/**
 * Extract code blocks from markdown-formatted text
 */
export function extractCodeBlocks(content: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = []
  
  // Match markdown code blocks with language specifier
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = (match[1] || 'typescript').toLowerCase()
    const code = match[2].trim()

    // Check if it's a supported language
    if (isSupportedLanguage(language)) {
      const hasReactComponent = detectReactComponent(code)
      const componentName = hasReactComponent ? extractComponentName(code) : undefined

      codeBlocks.push({
        code,
        language: normalizeLanguage(language),
        hasReactComponent,
        componentName,
      })
    }
  }

  return codeBlocks
}

/**
 * Check if the code contains a React component
 */
function detectReactComponent(code: string): boolean {
  // Check for common React patterns
  const reactPatterns = [
    /import.*from.*['"]react['"]/i,
    /export\s+(default\s+)?function/i,
    /export\s+const.*=.*\(/i,
    /function.*\{[\s\S]*return\s*\(/i,
    /(const|let|var).*=.*\(.*\)\s*=>\s*\{/i,
    /<[A-Z][\w]*[\s\S]*>/,  // JSX elements
  ]

  return reactPatterns.some(pattern => pattern.test(code))
}

/**
 * Extract component name from React code
 */
function extractComponentName(code: string): string | undefined {
  // Try to find export default function ComponentName
  const defaultFunctionMatch = code.match(/export\s+default\s+function\s+(\w+)/)
  if (defaultFunctionMatch) return defaultFunctionMatch[1]

  // Try to find export const ComponentName
  const constMatch = code.match(/export\s+const\s+(\w+)/)
  if (constMatch) return constMatch[1]

  // Try to find function ComponentName
  const functionMatch = code.match(/function\s+(\w+)/)
  if (functionMatch) return functionMatch[1]

  return undefined
}

/**
 * Check if language is supported for playground
 */
function isSupportedLanguage(lang: string): boolean {
  const supported = ['tsx', 'jsx', 'typescript', 'javascript', 'ts', 'js', 'html', 'css']
  return supported.includes(lang.toLowerCase())
}

/**
 * Normalize language name for consistency
 */
function normalizeLanguage(lang: string): CodeBlock['language'] {
  const normalized = lang.toLowerCase()
  
  switch (normalized) {
    case 'ts':
    case 'typescript':
      return 'typescript'
    case 'js':
    case 'javascript':
      return 'javascript'
    case 'tsx':
      return 'tsx'
    case 'jsx':
      return 'jsx'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    default:
      return 'tsx' // Default to TSX for React components
  }
}

/**
 * Check if content should display in playground
 * (has valid React/TypeScript code)
 */
export function shouldShowPlayground(content: string): boolean {
  const blocks = extractCodeBlocks(content)
  return blocks.some(block => block.hasReactComponent)
}

/**
 * Get the primary code block to display in playground
 * (prioritizes React components)
 */
export function getPrimaryCodeBlock(content: string): CodeBlock | null {
  const blocks = extractCodeBlocks(content)
  
  // Prioritize React components
  const reactBlock = blocks.find(block => block.hasReactComponent)
  if (reactBlock) return reactBlock

  // Fall back to first code block
  return blocks[0] || null
}
