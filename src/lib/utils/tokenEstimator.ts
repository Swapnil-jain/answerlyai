export const estimateTokens = {
  text: (text: string) => Math.ceil(text.length / 4), // Rough estimation of tokens
  
  faq: (question: string, answer: string) => 
    Math.ceil((question.length + answer.length) / 4),
  
  workflow: (nodes: any[], edges: any[]) => {
    // Calculate tokens for node labels and data
    const nodeTokens = nodes.reduce((acc, node) => {
      const labelLength = (node.data?.label || '').length
      // Add extra tokens for specific node types that might have additional data
      const extraTokens = node.type === 'decision' ? 20 : 10 // Extra tokens for node structure
      return acc + Math.ceil(labelLength / 4) + extraTokens
    }, 0)

    // Add base tokens for workflow structure
    const baseTokens = 100 // Base tokens for workflow structure
    return nodeTokens + baseTokens
  }
} 