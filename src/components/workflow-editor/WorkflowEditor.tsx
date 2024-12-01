'use client'

import 'reactflow/dist/style.css'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
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
import { Save, MessageSquare, Code, Maximize2, LayoutDashboard, Home, LogOut, Sparkles } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/provider'
import AuthGuard from '@/components/auth/AuthGuard'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

import StartNode from './nodes/StartNode'
import DecisionNode from './nodes/DecisionNode'
import ActionNode from './nodes/ActionNode'
import ScenarioNode from './nodes/ScenarioNode'
import Sidebar from './Sidebar'
import SavedWorkflows from './SavedWorkflows'
import { Button } from '@/components/ui/button'
import { workflowCache } from '@/lib/cache/workflowCache'
import { ensureUserTier } from '@/lib/utils/subscription'
import { TIER_LIMITS } from '@/lib/constants/tiers'
import { eventEmitter } from '@/lib/utils/events'

// Move this to the top, after imports and before any other code
const generateUniqueId = (nodeType: string) => {
  return `${nodeType}_${Math.random().toString(36).substr(2, 9)}`
}

// Add this CSS to ensure nodes maintain minimum dimensions
const nodeDefaultStyle = {
  minWidth: '150px',
  minHeight: '50px',
  padding: '10px',
  backgroundColor: 'white',
  border: '1px solid #ccc',
  borderRadius: '5px',
}

// Define node components with memo
const MemoizedStartNode = React.memo(StartNode)
const MemoizedDecisionNode = React.memo(DecisionNode)
const MemoizedActionNode = React.memo(ActionNode)
const MemoizedScenarioNode = React.memo(ScenarioNode)

// Define nodeTypes with useMemo
const createNodeTypes = () => ({
  start: MemoizedStartNode,
  decision: MemoizedDecisionNode,
  action: MemoizedActionNode,
  scenario: MemoizedScenarioNode,
})

const initialNodes: Node[] = [
  {
    id: generateUniqueId('start'),
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

// Add this near the top of the file with other imports
const proOptions = { hideAttribution: true }

// Add this helper function to check if a node is connected
const isNodeConnected = (nodeId: string, edges: Edge[]) => {
  return edges.some(edge => 
    edge.source === nodeId || edge.target === nodeId
  );
}

// Add this helper function to check node connections
const getNodeConnections = (nodeId: string, edges: Edge[]) => {
  const outgoing = edges.filter(edge => edge.source === nodeId)
  const incoming = edges.filter(edge => edge.target === nodeId)
  return { outgoing, incoming }
}

// Add this helper function to check if a path leads to action nodes
const validateDecisionPath = (
  nodeId: string, 
  edges: Edge[], 
  nodes: Node[], 
  visited: Set<string> = new Set()
): boolean => {
  // Prevent infinite loops
  if (visited.has(nodeId)) return false;
  visited.add(nodeId);

  // Get outgoing connections
  const outgoing = edges.filter(edge => edge.source === nodeId);
  
  // If no outgoing connections, path is invalid
  if (outgoing.length === 0) return false;

  // Check each outgoing connection
  return outgoing.every(connection => {
    const targetNode = nodes.find(node => node.id === connection.target);
    if (!targetNode) return false;

    // If it's an action node, path is valid
    if (targetNode.type === 'action') return true;

    // If it's a decision node, recursively check its paths
    if (targetNode.type === 'decision') {
      return validateDecisionPath(targetNode.id, edges, nodes, visited);
    }

    return false;
  });
};

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
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ title: string; description: string }>({
    title: '',
    description: ''
  })
  const [workflowToOverwrite, setWorkflowToOverwrite] = useState<string | null>(null)

  // Memoize nodeTypes
  const nodeTypes = useMemo(() => createNodeTypes(), [])

  // Add this state to track if we should navigate after alert closes
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Add this state to track the current workflow's data
  const [currentWorkflow, setCurrentWorkflow] = useState<{
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
  } | null>(null)

  const saveWorkflow = async () => {
    if (isSaving) return
    
    try {
      validateWorkflow()
      setIsSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in to save your workflow')

      // Ensure user has a tier entry
      await ensureUserTier(supabase, user.id)

      // Get user's tier and current workflow count
      const { data: tierData, error: tierError } = await supabase
        .from('user_tiers')
        .select('pricing_tier, workflow_count')
        .eq('user_id', user.id)
        .single()

      if (tierError) throw tierError

      const currentTier = tierData?.pricing_tier || 'hobbyist'
      const currentCount = tierData?.workflow_count || 0
      const tierLimit = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS]

      // Check if user has reached their limit (only for new workflows)
      if (!workflowId && currentCount >= tierLimit) {
        throw new Error(
          `You've reached the maximum limit of ${tierLimit} ${
            tierLimit === 1 ? 'workflow' : 'workflows'
          } for your ${currentTier} tier. Please upgrade to create more workflows.`
        )
      }

      // If we have a workflowId, this is an existing workflow
      if (workflowId) {
        // First check if this name already exists for a different workflow
        const { data: existingWorkflow } = await supabase
          .from('workflows')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', workflowName)
          .neq('id', workflowId) // Important: exclude current workflow
          .single()

        if (existingWorkflow) {
          throw new Error(`A workflow with the name "${workflowName}" already exists. Please choose a different name.`)
        }

        // Update existing workflow
        const { data, error } = await supabase
          .from('workflows')
          .update({
            name: workflowName,
            nodes: nodes,
            edges: edges,
            updated_at: new Date().toISOString()
          })
          .eq('id', workflowId)
          .select()
          .single()

        if (error) throw error

        // Update cache
        if (data) {
          workflowCache.setWorkflow(data)
          
          // Update the list cache
          const listCache = workflowCache.getWorkflowList()
          if (listCache) {
            const updatedList = listCache.map(w => 
              w.id === data.id 
                ? { 
                    id: data.id, 
                    name: data.name, 
                    updated_at: data.updated_at 
                  }
                : w
            )
            workflowCache.setWorkflowList(updatedList)
          }
        }

        showAlert('Success! 🎉', 'Your workflow has been saved successfully.')
      } else {
        // This is a new workflow
        // Check if a workflow with this name already exists
        const { data: existingWorkflow } = await supabase
          .from('workflows')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('name', workflowName)
          .single()

        if (existingWorkflow) {
          throw new Error(`A workflow named "${workflowName}" already exists. Please choose a different name.`)
        }

        // Create new workflow
        const workflowData = {
          name: workflowName,
          nodes: nodes,
          edges: edges,
          user_id: user.id,
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('workflows')
          .insert([workflowData])
          .select()
          .single()

        if (error) throw error

        // Update cache first
        if (data) {
          workflowCache.setWorkflow(data)
          
          // Update the list cache
          const listCache = workflowCache.getWorkflowList()
          if (listCache) {
            const updatedList = [...listCache, { 
              id: data.id, 
              name: data.name, 
              updated_at: data.updated_at 
            }]
            workflowCache.setWorkflowList(updatedList)
          }

          // Set pending navigation and show alert
          setPendingNavigation(`/builder/${data.id}`)
          showAlert('Success! 🎉', 'Your workflow has been created successfully.')
        }
      }
    } catch (error) {
      showAlert(
        'Error Saving Workflow',
        error instanceof Error ? error.message : 'Failed to save workflow. Please try again.'
      )
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
        
        // Try to get from cache first
        const cachedWorkflow = workflowCache.getWorkflow(workflowId)
        if (cachedWorkflow) {
          setNodes(cachedWorkflow.nodes || initialNodes)
          setEdges(cachedWorkflow.edges || [])
          setWorkflowName(cachedWorkflow.name)
          setIsLoading(false)
          return
        }

        // Load from database if not in cache
        const { data: workflow, error } = await supabase
          .from('workflows')
          .select('*')
          .eq('id', workflowId)
          .single()

        if (error) throw error

        // Update state and cache
        setNodes(workflow.nodes || initialNodes)
        setEdges(workflow.edges || [])
        setWorkflowName(workflow.name)
        workflowCache.setWorkflow(workflow)
      } catch (error) {
        console.error('Error loading workflow:', error)
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
      if (!type) return

      // Get the position of the drop relative to the workflow pane
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - 240, // Adjust for sidebar width
        y: event.clientY,
      })

      const newNode: Node = {
        id: generateUniqueId(type),  // Use unique ID generator
        type,
        position,
        data: { label: type.charAt(0).toUpperCase() + type.slice(1) },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes]
  )

  const validateWorkflow = () => {
    // Check if workflow has a name
    if (!workflowName.trim()) {
      throw new Error('Please give your workflow a name before saving')
    }

    // Check if start node exists
    const startNodes = nodes.filter(node => node.type === 'start')
    if (startNodes.length === 0) {
      throw new Error('Your workflow needs a Start node - drag one from the sidebar to get started')
    }

    // Check for disconnected nodes (except Start node)
    const disconnectedNodes = nodes.filter(node => {
      if (node.type === 'start') return false
      return !isNodeConnected(node.id, edges)
    })

    if (disconnectedNodes.length > 0) {
      const nodeTypes = disconnectedNodes.map(node => node.type).join(', ')
      throw new Error(
        `Please connect all nodes before saving. Disconnected nodes: ${nodeTypes}`
      )
    }

    // Only check Start node connection if there are other nodes
    const nonStartNodes = nodes.filter(node => node.type !== 'start')
    if (nonStartNodes.length > 0) {
      const startNode = nodes.find(node => node.type === 'start')
      if (startNode && !isNodeConnected(startNode.id, edges)) {
        throw new Error('The Start node must be connected when other nodes are present')
      }
    }

    // Validate decision nodes
    const decisionNodes = nodes.filter(node => node.type === 'decision')
    for (const decisionNode of decisionNodes) {
      const { outgoing, incoming } = getNodeConnections(decisionNode.id, edges)
      
      // Check if decision node has incoming connections
      if (incoming.length === 0) {
        throw new Error(`Decision node "${decisionNode.data.label}" must have an incoming connection`)
      }

      // Check if decision node has exactly two outgoing connections (Yes/No)
      if (outgoing.length !== 2) {
        throw new Error(
          `Decision node "${decisionNode.data.label}" must have exactly two outgoing connections (Yes and No)`
        )
      }

      // Check if both paths eventually lead to action nodes
      const isValidPath = outgoing.every(connection => {
        const targetNode = nodes.find(node => node.id === connection.target)
        if (!targetNode) return false

        if (targetNode.type === 'action') return true

        if (targetNode.type === 'decision') {
          return validateDecisionPath(targetNode.id, edges, nodes, new Set([decisionNode.id]))
        }

        return false
      })

      if (!isValidPath) {
        throw new Error(
          `Decision node "${decisionNode.data.label}" must have paths that ultimately lead to Action nodes`
        )
      }
    }

    // Check if all nodes (except Start) have custom text
    const emptyNodes = nodes.filter(node => {
      if (node.type === 'start') return false
      
      const label = node.data?.label?.trim() || ''
      return !label || 
             (node.type === 'action' && label === 'Action') ||
             (node.type === 'decision' && label === 'Decision') ||
             (node.type === 'scenario' && label === 'Scenario')
    })

    if (emptyNodes.length > 0) {
      throw new Error('Please add custom text to all your nodes before saving')
    }

    return true
  }

  const showAlert = (title: string, description: string) => {
    setAlertMessage({ title, description })
    setAlertOpen(true)
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

  // Add this function to prevent Start node deletion
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    const hasStartNode = nodesToDelete.some(node => node.type === 'start')
    if (hasStartNode) {
      showAlert(
        'Cannot Delete Start Node',
        'The Start node is required and cannot be deleted'
      )
      return false
    }
    return true
  }, [])

  // Add this to filter out Start node deletion
  const handleNodesChange = useCallback((changes) => {
    // Filter out any attempts to remove the Start node
    const safeChanges = changes.filter(change => {
      if (change.type === 'remove') {
        const nodeToDelete = nodes.find(node => node.id === change.id)
        if (nodeToDelete?.type === 'start') {
          return false
        }
      }
      return true
    })
    
    onNodesChange(safeChanges)
  }, [nodes, onNodesChange])

  // Add loading state for new workflow creation
  const [isCreating, setIsCreating] = useState(false)

  const addNewWorkflow = async () => {
    try {
      setIsCreating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in to create a workflow')

      // Get user's tier and current workflow count
      const { data: tierData, error: tierError } = await supabase
        .from('user_tiers')
        .select('pricing_tier, workflow_count')
        .eq('user_id', user.id)
        .single()

      if (tierError) throw tierError

      const currentTier = tierData?.pricing_tier || 'hobbyist'
      const currentCount = tierData?.workflow_count || 0
      const tierLimit = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS]

      // Check if user has reached their limit
      if (currentCount >= tierLimit) {
        showAlert(
          'Workflow Limit Reached',
          `You've reached the maximum limit of ${tierLimit} ${
            tierLimit === 1 ? 'workflow' : 'workflows'
          } for your ${currentTier} tier. Please upgrade to create more workflows.`
        )
        return
      }

      // If within limits, create new workflow with unique ID for start node
      setNodes([
        {
          id: generateUniqueId('start'),
          type: 'start',
          position: { x: 0, y: 0 },
          data: { label: 'Start' }
        }
      ])
      setEdges([])
      setWorkflowName('New Workflow')
      router.push('/builder')
    } catch (error) {
      showAlert(
        'Error Creating Workflow',
        error instanceof Error ? error.message : 'Failed to create new workflow'
      )
    } finally {
      setIsCreating(false)
    }
  }

  // Update the AlertDialog to handle navigation
  const handleAlertClose = () => {
    setAlertOpen(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleWorkflowSelect = useCallback(async (selectedWorkflowId: string) => {
    try {
      setIsLoading(true)
      
      // Try to get from cache first
      const cachedWorkflow = workflowCache.getWorkflow(selectedWorkflowId)
      if (cachedWorkflow) {
        setNodes(cachedWorkflow.nodes || initialNodes)
        setEdges(cachedWorkflow.edges || [])
        setWorkflowName(cachedWorkflow.name)
        setCurrentWorkflow({
          id: selectedWorkflowId,
          name: cachedWorkflow.name,
          nodes: cachedWorkflow.nodes || initialNodes,
          edges: cachedWorkflow.edges || []
        })
        window.history.pushState({}, '', `/builder/${selectedWorkflowId}`)
        setIsLoading(false)
        return
      }

      // Load from database if not in cache
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', selectedWorkflowId)
        .single()

      if (error) throw error

      // Update state and cache
      setNodes(workflow.nodes || initialNodes)
      setEdges(workflow.edges || [])
      setWorkflowName(workflow.name)
      setCurrentWorkflow({
        id: selectedWorkflowId,
        name: workflow.name,
        nodes: workflow.nodes || initialNodes,
        edges: workflow.edges || []
      })
      workflowCache.setWorkflow(workflow)
      window.history.pushState({}, '', `/builder/${selectedWorkflowId}`)
    } catch (error) {
      console.error('Error loading workflow:', error)
      setNodes(initialNodes)
      setEdges([])
      setWorkflowName('My Workflow')
      setCurrentWorkflow(null)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, setNodes, setEdges, initialNodes])

  // Add these functions
  const handleChatbotClick = () => {
    const currentWorkflowId = window.location.pathname.split('/builder/')[1]
    if (!currentWorkflowId) {
      console.error('No workflow ID found in URL')
      return
    }
    router.push(`/chat/${currentWorkflowId}`)
  }

  const handleWidgetClick = () => {
    const currentWorkflowId = window.location.pathname.split('/builder/')[1]
    if (!currentWorkflowId) {
      console.error('No workflow ID found in URL')
      return
    }
    router.push(`/widget/${currentWorkflowId}`)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Add loading overlay */}
      {(isLoading || isCreating) && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="flex flex-1 h-[calc(100vh-64px)] relative">
        <div className="absolute inset-y-0 left-0 w-64 bg-white border-r z-30 flex flex-col">
          <Sidebar
            className="w-64 border-r bg-white"
            onNewWorkflow={addNewWorkflow}
            workflowId={workflowId}
            isCreating={isCreating}
            onSaveWorkflow={saveWorkflow}
          />
          <SavedWorkflows onWorkflowSelect={handleWorkflowSelect} />
        </div>
        <div className="flex-grow flex flex-col ml-64 relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Loading workflow...</div>
            </div>
          ) : (
            <>
              <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
                <Button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reactFlowInstance.fitView({ padding: 0.2 })}
                  className="flex items-center gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 relative">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  nodeTypes={nodeTypes}
                  nodesDraggable={true}
                  defaultViewport={defaultViewport}
                  proOptions={proOptions}
                  fitView
                >
                  <Controls />
                  <MiniMap />
                  <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
              </div>
              <div className="flex justify-between items-center p-4 bg-white border-t">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">Current Workflow</span>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                    placeholder="Enter workflow name..."
                  />
                </div>
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
                    onClick={handleChatbotClick}
                    disabled={!workflowId}
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    See Live Chatbot
                  </Button>
                  <Button
                    onClick={handleWidgetClick}
                    disabled={!workflowId}
                    className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
                  >
                    <Code className="h-4 w-4" />
                    Get Widget Code
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <AlertDialog open={alertOpen} onOpenChange={handleAlertClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAlertClose}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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