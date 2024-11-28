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
import { useSupabase } from '@/lib/supabase/provider'
import AuthGuard from '@/components/auth/AuthGuard'

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

interface SavedWorkflow {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  updatedAt: string
}

const MAX_WORKFLOWS = 5;

// Create a new component for the flow content
function Flow({ workflowId }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [workflowName, setWorkflowName] = useState('My Workflow')
  const reactFlowInstance = useReactFlow()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { supabase } = useSupabase()

  const saveWorkflow = async () => {
    if (isSaving) return
    
    try {
      validateWorkflow()
      setIsSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check for existing workflow with same name
      const { data: existingWorkflow } = await supabase
        .from('workflows')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('name', workflowName)
        .single()

      if (existingWorkflow) {
        const shouldOverwrite = confirm(
          `A workflow named "${workflowName}" already exists. \n\nWould you like to overwrite it?`
        )

        if (!shouldOverwrite) {
          alert('Please choose a different name for your workflow')
          return
        }

        // Update existing workflow
        const { data, error } = await supabase
          .from('workflows')
          .update({
            nodes: nodes,
            edges: edges,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWorkflow.id)
          .select()
          .single()

        if (error) throw error

        // Update URL to existing workflow ID
        router.push(`/builder/${existingWorkflow.id}`)
        alert('Workflow updated successfully!')
        return
      }

      // Check total number of workflows
      const { count, error: countError } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) throw countError

      if (count && count >= MAX_WORKFLOWS) {
        const shouldDelete = confirm(
          `You've reached the maximum limit of ${MAX_WORKFLOWS} workflows. \n\n` +
          `Would you like to see your workflows to delete some?`
        )

        if (shouldDelete) {
          // You could either redirect to a workflow management page
          // or just let them use the sidebar to delete workflows
          alert('Please delete an existing workflow from the sidebar before creating a new one.')
        }
        return
      }

      // Create new workflow if under the limit
      const newWorkflow = {
        name: workflowName,
        nodes: nodes,
        edges: edges,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('workflows')
        .insert([newWorkflow])
        .select()
        .single()

      if (error) throw error

      // Update URL to the new workflow ID
      router.push(`/builder/${data.id}`)
      alert('Workflow saved successfully!')

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
        const { data: workflow, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', workflowId)
          .single()

        if (error) throw error

        setNodes(workflow.nodes || initialNodes)
        setEdges(workflow.edges || [])
        setWorkflowName(workflow.name)
      } catch (error) {
        console.error('Error loading workflow:', error)
        // Set default state on error
        setNodes(initialNodes)
        setEdges([])
        setWorkflowName('My Workflow')
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
  return (
    <AuthGuard>
      <ReactFlowProvider>
        <Flow workflowId={workflowId} />
      </ReactFlowProvider>
    </AuthGuard>
  )
}

// Export the wrapper instead of the direct component
export default WorkflowEditorWrapper