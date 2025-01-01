export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    [key: string]: any;
  };
}

export interface WorkflowEdge {
  source: string;
  target: string;
  sourceHandle?: string;
}

export class WorkflowManager {
  // Add scenario tracking
  private static readonly SCENARIOS = {
    returns: /return|refund|exchange/i,
    shipping: /shipping|delivery|track/i,
    warranty: /warranty|damaged|repair/i
  };

  static getRelevantWorkflowSection(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    currentNodeId?: string,
    depth: number = 2,
    userMessage?: string // Add message parameter
  ) {
    // Enhanced scenario detection
    if (!currentNodeId && userMessage) {
      const scenarioNode = nodes.find(node => {
        if (node.type !== 'scenario') return false;
        const label = node.data.label.toLowerCase();
        const message = userMessage.toLowerCase();
        
        // Check if message contains key terms from scenario label
        const terms = label.split(/\s+/);
        return terms.some(term => 
          term.length > 3 && message.includes(term.toLowerCase())
        );
      });
      
      if (scenarioNode) {
        currentNodeId = scenarioNode.id;
      }
    }

    if (!currentNodeId) {
      // If no current node, return only start nodes and their immediate connections
      return this.getStartNodesSection(nodes, edges);
    }

    const relevantNodes = new Set<string>();
    const relevantEdges = new Set<string>();
    
    // Add current node
    relevantNodes.add(currentNodeId);
    
    // Add connected nodes up to specified depth
    this.addConnectedNodes(
      currentNodeId,
      nodes,
      edges,
      relevantNodes,
      relevantEdges,
      depth
    );

    // Add size limit
    const MAX_NODES = 5;
    if (relevantNodes.size > MAX_NODES) {
      const nodeArray = Array.from(relevantNodes);
      const limitedNodes = new Set(nodeArray.slice(0, MAX_NODES));
      return {
        nodes: nodes
          .filter(node => limitedNodes.has(node.id))
          .map(node => this.sanitizeNode(node)),
        edges: edges
          .filter(edge => 
            limitedNodes.has(edge.source) && 
            limitedNodes.has(edge.target)
          )
          .map(edge => this.sanitizeEdge(edge))
      };
    }

    return {
      nodes: nodes
        .filter(node => relevantNodes.has(node.id))
        .map(node => this.sanitizeNode(node)),
      edges: edges
        .filter(edge => 
          relevantNodes.has(edge.source) && 
          relevantNodes.has(edge.target)
        )
        .map(edge => this.sanitizeEdge(edge))
    };
  }

  private static getStartNodesSection(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    const relevantNodes = new Set<string>();
    const startNodes = nodes.filter(node => node.type === 'start');
    
    startNodes.forEach(node => {
      relevantNodes.add(node.id);
      // Add immediate connections
      edges
        .filter(edge => edge.source === node.id)
        .forEach(edge => {
          relevantNodes.add(edge.target);
        });
    });

    return {
      nodes: nodes.filter(node => relevantNodes.has(node.id)),
      edges: edges.filter(edge => 
        relevantNodes.has(edge.source) && relevantNodes.has(edge.target)
      )
    };
  }

  private static addConnectedNodes(
    nodeId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    relevantNodes: Set<string>,
    relevantEdges: Set<string>,
    depth: number
  ) {
    if (depth === 0) return;

    // Get all connected edges
    const connectedEdges = edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );

    connectedEdges.forEach(edge => {
      relevantEdges.add(`${edge.source}-${edge.target}`);
      
      // Add connected nodes
      const connectedId = edge.source === nodeId ? edge.target : edge.source;
      if (!relevantNodes.has(connectedId)) {
        relevantNodes.add(connectedId);
        // Recursively add connected nodes with reduced depth
        this.addConnectedNodes(
          connectedId,
          nodes,
          edges,
          relevantNodes,
          relevantEdges,
          depth - 1
        );
      }
    });
  }

  static updateWorkflowPosition(
    currentNode: string,
    action: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): string | null {
    // Find the next node based on action
    const edge = edges.find(e => 
      e.source === currentNode && 
      (e.sourceHandle === action || !e.sourceHandle)
    );

    return edge?.target || null;
  }

  private static sanitizeNode(node: WorkflowNode): WorkflowNode {
    // Enhanced node sanitization
    const sanitized = {
      id: node.id,
      type: node.type,
      data: {
        label: node.data.label
          .replace(/please /i, '')
          .replace(/you may/i, 'can')
          .replace(/we offer/i, 'offers')
          .replace(/\b(the|a|an)\s+/gi, '')
          .trim()
      }
    };

    // Only include essential data
    if (node.type === 'decision' || node.type === 'scenario') {
      sanitized.data = {
        ...sanitized.data,
        ...(node.data.required && { required: node.data.required }),
        ...(node.data.type && { type: node.data.type })
      };
    }

    return sanitized;
  }

  private static sanitizeEdge(edge: WorkflowEdge): WorkflowEdge {
    return {
      source: edge.source,
      target: edge.target,
      ...(edge.sourceHandle && { sourceHandle: edge.sourceHandle })
    };
  }
} 