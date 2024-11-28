'use client'

import 'reactflow/dist/style.css'
import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  DefaultEdge,
  ViewportProps,
} from 'reactflow'
import { useRouter } from 'next/navigation'
import { Save, MessageSquare } from 'lucide-react'

import StartNode from './nodes/StartNode'
import DecisionNode from './nodes/DecisionNode'
import ActionNode from './nodes/ActionNode'
import ScenarioNode from './nodes/ScenarioNode'
import Sidebar from './Sidebar'
import TestingPanel from './TestingPanel'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'

const nodeTypes = {
  start: StartNode,
  decision: DecisionNode,
  action: ActionNode,
  scenario: ScenarioNode,
}

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'start',
    data: { label: 'Start' },
    position: { x: 400, y: 200 },
  },
]

// Add default viewport configuration
const defaultViewport: Partial<ViewportProps> = {
  x: 0,
  y: 0,
  zoom: 0.5  // Adjust this value to control initial zoom level (1 is 100%, 0.5 is 50%)
}

interface WorkflowEditorProps {
  workflowId?: string
}

// Create a new component for the flow content
function Flow({ workflowId }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [workflowName, setWorkflowName] = useState('My Workflow')
  const reactFlowInstance = useReactFlow()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const saveWorkflow = async () => {
    if (isSaving) return
    
    try {
      validateWorkflow()

      // Always create a new workflow when saving
      setIsSaving(true)
      const workflow = {
        // Remove the id to force creation of a new workflow
        name: workflowName,
        nodes: nodes,
        edges: edges,
        updatedAt: new Date().toISOString()
      }

      const saveResponse = await fetch('/api/save-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      })

      const saveData = await saveResponse.json()

      if (saveData.success) {
        // Always update the URL with the new workflow ID
        router.replace(`/workflow/${saveData.workflowId}`)
        alert('Workflow saved successfully!')
      } else {
        throw new Error(saveData.message)
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to save workflow')
    } finally {
      setIsSaving(false)
    }
  }

  // Load existing workflow
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/load-workflow?id=${workflowId}`)
        const data = await response.json()

        if (data.success && data.workflow) {
          setNodes(data.workflow.nodes || [])
          setEdges(data.workflow.edges || [])
          // When loading an existing workflow, append " (Copy)" to the name
          setWorkflowName(`${data.workflow.name} (Copy)`)
        } else {
          console.error('Failed to load workflow:', data)
        }
      } catch (error) {
        console.error('Error loading workflow:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflow()
  }, [workflowId, setNodes, setEdges])

  const onConnect = useCallback((params) => {
    // Validate scenario connections
    if (params.sourceHandle === 'scenario-out') {
      // Only allow connections to decision nodes' scenario handles
      if (!params.targetHandle?.startsWith('scenario-in')) {
        return
      }
    }

    // Prevent connections to scenario nodes' output
    if (params.targetHandle === 'scenario-out') {
      return
    }

    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (typeof type === 'undefined' || !type) {
        return
      }

      // Get the current viewport position
      const { x: viewportX, y: viewportY, zoom } = reactFlowInstance.getViewport()
      
      // Calculate the position relative to the viewport
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${type}-${nodes.length + 1}`,
        type,
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)}` },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [nodes, setNodes, reactFlowInstance]
  )

  const validateWorkflow = () => {
    // Check if workflow has a name
    if (!workflowName.trim()) {
      throw new Error('Workflow name is required')
    }

    // Check if there are any nodes
    if (nodes.length <= 1) { // Only start node
      throw new Error('Workflow must have at least one node besides Start')
    }

    // Check if all nodes are connected
    const connectedNodeIds = new Set()
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    })
    
    const disconnectedNodes = nodes.filter(node => 
      node.type !== 'start' && !connectedNodeIds.has(node.id)
    )
    
    if (disconnectedNodes.length > 0) {
      throw new Error('All nodes must be connected')
    }

    return true
  }

  const onNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          }
        }
        return node
      })
    )
  }, [setNodes])

  React.useEffect(() => {
    // Small delay to ensure the flow is rendered
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 100);
  }, [reactFlowInstance]);

  return (
    <div className="flex flex-col h-screen">
      <Header className="z-50" />
      <div className="flex flex-1 h-[calc(100vh-64px)] relative">
        <div className="absolute inset-y-0 left-0 w-64 bg-white border-r z-30">
          <Sidebar className="h-full" />
        </div>
        <div className="flex-grow flex flex-col ml-64">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Loading workflow...</div>
            </div>
          ) : (
            <>
              <div className="flex-1 relative">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  nodeTypes={nodeTypes}
                  nodesDraggable={true}
                  defaultViewport={defaultViewport}
                  fitView
                >
                  <Controls />
                  <MiniMap />
                  <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
              </div>
              <div className="flex justify-between items-center p-4 bg-white border-t">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name..."
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={saveWorkflow} 
                    disabled={isSaving}
                    className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => router.push(`/chat/${workflowId}`)}
                    disabled={!workflowId}
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    See Live Chatbot
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        <TestingPanel 
          nodes={nodes} 
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
        />
      </div>
    </div>
  )
}

// Create a wrapper component to handle initialization
function WorkflowEditorWrapper({ workflowId }: WorkflowEditorProps) {
  const [isClientSide, setIsClientSide] = useState(false)

  useEffect(() => {
    setIsClientSide(true)
  }, [])

  if (!isClientSide) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <ReactFlowProvider>
      <Flow workflowId={workflowId} />
    </ReactFlowProvider>
  )
}

// Export the wrapper instead of the direct component
export default WorkflowEditorWrapper