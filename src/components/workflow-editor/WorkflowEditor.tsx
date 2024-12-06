'use client'

import 'reactflow/dist/style.css'
import React, { useState, useCallback, useEffect, useRef } from 'react'
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
  BackgroundVariant,
  Viewport,
  Connection,
  NodeChange,
} from 'reactflow'
import { useRouter } from 'next/navigation'
import { Save, MessageSquare, Code, Maximize2, LayoutDashboard, Home, LogOut, BookOpen } from 'lucide-react'
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
import { RateLimiter } from '@/lib/utils/rateLimiter'
import { estimateTokens } from '@/lib/utils/tokenEstimator'
import { isAdmin } from '@/lib/utils/adminCheck'
import { eventEmitter } from '@/lib/utils/events'
import { SAMPLE_WORKFLOW_ID } from '@/lib/utils/adminCheck'

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

// Move these outside the component
const MemoizedStartNode = React.memo(StartNode)
const MemoizedDecisionNode = React.memo(DecisionNode)
const MemoizedActionNode = React.memo(ActionNode)
const MemoizedScenarioNode = React.memo(ScenarioNode)

// Create nodeTypes outside the component
const nodeTypes = {
  start: MemoizedStartNode,
  decision: MemoizedDecisionNode,
  action: MemoizedActionNode,
  scenario: MemoizedScenarioNode,
}

const initialNodes: Node[] = [
  {
    id: generateUniqueId('start'),
    type: 'start',
    data: { label: 'Start' },
    position: { x: 400, y: 200 },
  },
]

// Add default viewport configuration
const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 }

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

// Add this interface near the top with other interfaces
interface AlertMessageType {
  title: string
  description: string
  type: 'success' | 'navigation'
  onClose?: () => void
}

// Add this type definition near the top with other interfaces
interface RateLimitResponse {
  allowed: boolean
  reason?: string
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
  const { supabase } = useSupabase()
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState<AlertMessageType>({
    title: '',
    description: '',
    type: 'success',
    onClose: undefined
  })
  const [workflowToOverwrite, setWorkflowToOverwrite] = useState<string | null>(null)

  // Add this state to track if we should navigate after alert closes
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Add this state to track the current workflow's data
  const [currentWorkflow, setCurrentWorkflow] = useState<{
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
  } | null>(null)

  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | undefined>(workflowId)

  // Update currentWorkflowId when workflowId prop changes
  useEffect(() => {
    setCurrentWorkflowId(workflowId)
  }, [workflowId])

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Add a ref to track initial load
  const isInitialLoad = useRef(true)

  // Add a ref to track if this is a fresh page load
  const isFreshLoad = useRef(true)

  // Add refs to store initial values
  const initialNodesRef = useRef<Node[]>([])
  const initialEdgesRef = useRef<Edge[]>([])
  const initialNameRef = useRef('')

  // Add a ref to track mounted state
  const isMounted = useRef(false)

  // Track changes to detect unsaved work
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }

    const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(initialNodesRef.current)
    const edgesChanged = JSON.stringify(edges) !== JSON.stringify(initialEdgesRef.current)
    const nameChanged = workflowName !== initialNameRef.current

    setHasUnsavedChanges(nodesChanged || edgesChanged || nameChanged)
  }, [nodes, edges, workflowName])

  // Update initial refs when workflow is loaded or saved
  useEffect(() => {
    if (!isFreshLoad.current) return
    
    initialNodesRef.current = nodes
    initialEdgesRef.current = edges
    initialNameRef.current = workflowName
    isFreshLoad.current = false
  }, [nodes, edges, workflowName])

  // Reset fresh load flag when workflow ID changes
  useEffect(() => {
    isFreshLoad.current = true
    isInitialLoad.current = true
  }, [workflowId])

  // Update the effect to track changes
  useEffect(() => {
    // Skip if not mounted yet or loading
    if (!isMounted.current || isLoading) {
      return
    }

    // Skip during initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      // Store initial values
      initialNodesRef.current = nodes
      initialEdgesRef.current = edges
      initialNameRef.current = workflowName
      setHasUnsavedChanges(false)
      return
    }

    // Skip if we're just loading the default state
    if (
      nodes.length === 1 && 
      nodes[0].type === 'start' && 
      edges.length === 0 && 
      workflowName === 'My Workflow'
    ) {
      setHasUnsavedChanges(false)
      return
    }

    // Compare current values with initial values
    const hasNodeChanges = JSON.stringify(nodes) !== JSON.stringify(initialNodesRef.current)
    const hasEdgeChanges = JSON.stringify(edges) !== JSON.stringify(initialEdgesRef.current)
    const hasNameChange = workflowName !== initialNameRef.current

    setHasUnsavedChanges(hasNodeChanges || hasEdgeChanges || hasNameChange)
  }, [nodes, edges, workflowName, isLoading])

  // Add effect to handle mounting and initial state
  useEffect(() => {
    isMounted.current = true
    
    // Set initial values on mount or when workflow changes
    if (workflowId) {
      handleWorkflowSelect(workflowId)
    }

    return () => {
      isMounted.current = false
    }
  }, [workflowId])

  // Add an effect to handle page refresh
  useEffect(() => {
    if (workflowId && isFreshLoad.current) {
      handleWorkflowSelect(workflowId)
    }
  }, [workflowId])

  const showAlert = (
    title: string,
    description: string,
    type: 'success' | 'navigation' = 'success',
    onClose?: () => void
  ) => {
    setAlertMessage({ title, description, type, onClose })
    setAlertOpen(true)
  }

  // Add state for admin mode
  const [isAdminMode, setIsAdminMode] = useState(false)

  // Add effect to check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && isAdmin(user.id)) {
        setIsAdminMode(true)
      }
    }
    checkAdminStatus()
  }, [supabase])

  const saveWorkflow = async () => {
    if (isSaving) return false
    
    try {
      validateWorkflow()
      setIsSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in to save your workflow')

      // Choose appropriate table based on admin status
      const table = isAdmin(user.id) ? 'sample_workflows' : 'workflows'
      const isNewWorkflow = !currentWorkflowId

      // Skip rate limits and tier checks for admin users
      if (!isAdmin(user.id)) {
        // Keep all existing validation logic
        const workflowTokens = estimateTokens.workflow(nodes, edges)
        const rateLimitCheck = await RateLimiter.checkRateLimit(
          user.id,
          'training',
          workflowTokens
        ).catch(error => {
          console.error('Rate limit check error:', error)
          return { allowed: true } as RateLimitResponse
        })

        if (!rateLimitCheck.allowed) {
          throw new Error(
            'reason' in rateLimitCheck 
              ? rateLimitCheck.reason 
              : 'Training limit exceeded'
          )
        }

        // Keep existing duplicate name check
        const { data: existingWorkflow } = await supabase
          .from('workflows')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('name', workflowName)
          .neq('id', currentWorkflowId || '')
          .single()

        if (existingWorkflow) {
          throw new Error(`A workflow named "${workflowName}" already exists. Please choose a different name.`)
        }

        // Keep existing tier checks
        await ensureUserTier(supabase, user.id)
        const { data: tierData, error: tierError } = await supabase
          .from('user_tiers')
          .select('pricing_tier, workflow_count')
          .eq('user_id', user.id)
          .single()

        if (tierError) throw tierError

        const currentTier = tierData?.pricing_tier || 'hobbyist'
        const currentCount = tierData?.workflow_count || 0
        const tierLimit = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS]

        if (!currentWorkflowId && currentCount >= tierLimit) {
          throw new Error(
            `You've reached the maximum limit of ${tierLimit} ${
              tierLimit === 1 ? 'workflow' : 'workflows'
            } for your ${currentTier} tier. Please upgrade to create more workflows.`
          )
        }
      }

      // Prepare the workflow data differently based on table
      const workflowData = {
        id: currentWorkflowId || undefined,
        name: workflowName,
        nodes: nodes,
        edges: edges,
        updated_at: new Date().toISOString(),
        ...(table === 'workflows' ? { user_id: user.id } : {}) // Only add user_id for regular workflows
      }

      console.log('Saving workflow:', { table, workflowData }) // Debug log

      // Save to appropriate table
      const { data, error, status } = await supabase
        .from(table)
        .upsert(workflowData)
        .select()
        .single()

      console.log('Save response:', { data, error, status }) // Debug log

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to save workflow')
      }

      if (!data) {
        throw new Error('No data returned from save operation')
      }

      // Keep all existing cache update logic
      workflowCache.setWorkflow(data)
      
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

      // Emit event to update SavedWorkflows
      eventEmitter.emit('workflowUpdated', {
        id: data.id,
        name: data.name,
        updated_at: data.updated_at
      })

      // For non-admin users creating a new workflow, show success message with navigation
      if (!isAdmin(user.id) && isNewWorkflow) {
        showAlert(
          'Success! 🎉', 
          'Your workflow has been created successfully.',
          'success',
          () => router.push(`/builder/${data.id}`)
        )
      } else {
        showAlert('Success! 🎉', 'Your workflow has been saved successfully.')
      }

      setHasUnsavedChanges(false)
      return true

    } catch (error) {
      // Keep existing error handling
      if (error instanceof Error && error.message.includes('validation')) {
        throw error
      }
      console.error('Save error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      showAlert(
        'Error Saving Workflow',
        error instanceof Error ? error.message : 'Failed to save workflow. Please try again.'
      )
      return false
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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const table = isAdmin(user.id) ? 'sample_workflows' : 'workflows'
        const { data: workflow, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', workflowId)
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Error loading workflow: ${error.message}`)
        }

        if (!workflow) {
          throw new Error('Workflow not found')
        }

        const newNodes = workflow.nodes || initialNodes
        const newEdges = workflow.edges || []
        
        // Set initial values first
        initialNodesRef.current = newNodes
        initialEdgesRef.current = newEdges
        initialNameRef.current = workflow.name
        
        // Then update state
        setNodes(newNodes)
        setEdges(newEdges)
        setWorkflowName(workflow.name)
        setHasUnsavedChanges(false)

        setCurrentWorkflow({
          id: workflowId,
          name: workflow.name,
          nodes: newNodes,
          edges: newEdges
        })
        workflowCache.setWorkflow(workflow)
        window.history.pushState({}, '', `/builder/${workflowId}`)

      } catch (error) {
        console.error('Error loading workflow:', error)
        // Reset everything in error case
        initialNodesRef.current = initialNodes
        initialEdgesRef.current = []
        initialNameRef.current = 'My Workflow'
        
        setNodes(initialNodes)
        setEdges([])
        setWorkflowName('My Workflow')
        setCurrentWorkflow(null)
        setCurrentWorkflowId(undefined)
        setHasUnsavedChanges(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflow()
  }, [workflowId, setNodes, setEdges])

  const onConnect = useCallback((params: Connection) => {
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
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
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
      
      // Reset everything to initial state
      setNodes(initialNodes)
      setEdges([])
      setWorkflowName('My Workflow')
      setCurrentWorkflow(null)
      setCurrentWorkflowId(undefined)
      setHasUnsavedChanges(false)
      
      // Reset refs
      initialNodesRef.current = initialNodes
      initialEdgesRef.current = []
      initialNameRef.current = 'My Workflow'

      // Clear any pending navigation
      setPendingNavigation(null)
      
      // Update URL without full page reload
      window.history.pushState({}, '', '/builder')
    } catch (error) {
      console.error('Error creating new workflow:', error)
      showAlert('Error', 'Failed to create new workflow')
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
    const handleSelection = async () => {
      try {
        setIsLoading(true)
        setCurrentWorkflowId(selectedWorkflowId)
        
        // Try to get from cache first
        const cachedWorkflow = workflowCache.getWorkflow(selectedWorkflowId)
        if (cachedWorkflow) {
          const newNodes = cachedWorkflow.nodes || initialNodes
          const newEdges = cachedWorkflow.edges || []
          
          // Set initial values first
          initialNodesRef.current = newNodes
          initialEdgesRef.current = newEdges
          initialNameRef.current = cachedWorkflow.name
          
          // Then update state
          setNodes(newNodes)
          setEdges(newEdges)
          setWorkflowName(cachedWorkflow.name)
          setHasUnsavedChanges(false)

          setCurrentWorkflow({
            id: selectedWorkflowId,
            name: cachedWorkflow.name,
            nodes: newNodes,
            edges: newEdges
          })
          window.history.pushState({}, '', `/builder/${selectedWorkflowId}`)
          return
        }

        // Load from database if not in cache
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const table = isAdmin(user.id) ? 'sample_workflows' : 'workflows'
        const { data: workflow, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', selectedWorkflowId)
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Error loading workflow: ${error.message}`)
        }

        if (!workflow) {
          throw new Error('Workflow not found')
        }

        const newNodes = workflow.nodes || initialNodes
        const newEdges = workflow.edges || []
        
        // Set initial values first
        initialNodesRef.current = newNodes
        initialEdgesRef.current = newEdges
        initialNameRef.current = workflow.name
        
        // Then update state
        setNodes(newNodes)
        setEdges(newEdges)
        setWorkflowName(workflow.name)
        setHasUnsavedChanges(false)

        setCurrentWorkflow({
          id: selectedWorkflowId,
          name: workflow.name,
          nodes: newNodes,
          edges: newEdges
        })
        workflowCache.setWorkflow(workflow)
        window.history.pushState({}, '', `/builder/${selectedWorkflowId}`)

      } catch (error) {
        console.error('Error loading workflow:', error)
        // Reset everything in error case
        initialNodesRef.current = initialNodes
        initialEdgesRef.current = []
        initialNameRef.current = 'My Workflow'
        
        setNodes(initialNodes)
        setEdges([])
        setWorkflowName('My Workflow')
        setCurrentWorkflow(null)
        setCurrentWorkflowId(undefined)
        setHasUnsavedChanges(false)
      } finally {
        setIsLoading(false)
      }
    }

    if (hasUnsavedChanges) {
      showAlert(
        'Unsaved Changes',
        'Would you like to save your changes before switching workflows?',
        'success'
      )
      setPendingNavigation(`/builder/${selectedWorkflowId}`)
    } else {
      await handleSelection()
    }
  }, [supabase, setNodes, setEdges, initialNodes, hasUnsavedChanges])

  // Add these functions to handle navigation with unsaved changes
  const handleNavigationWithCheck = async (path: string) => {
    // Add a debug log to see the state
    console.log('Navigation check:', { hasUnsavedChanges, path })
    
    if (hasUnsavedChanges) {
      showAlert(
        'Unsaved Changes',
        'Would you like to save your changes before leaving?',
        'success'
      )
      setPendingNavigation(path)
    } else {
      router.push(path)
    }
  }

  const handleAlertAction = async () => {
    try {
      if (pendingNavigation) {
        if (alertMessage?.type === 'navigation') {
          // Handle logout
          await confirmLogout()
        } else {
          // Handle navigation with unsaved changes
          setIsSaving(true)
          const saveSuccessful = await saveWorkflow()
          if (saveSuccessful) {
            router.push(pendingNavigation)
          }
        }
      }
    } catch (error) {
      console.error('Error handling alert action:', error)
      showAlert(
        'Error',
        error instanceof Error ? error.message : 'An error occurred'
      )
    } finally {
      setIsSaving(false)
      setAlertOpen(false)
    }
  }

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      showAlert(
        'Unsaved Changes',
        'Would you like to save your changes before logging out?',
        'success'
      )
      setPendingNavigation('logout')
    } else {
      showAlert(
        'Confirm Logout',
        'Are you sure you want to logout?',
        'navigation'
      )
      setPendingNavigation('logout')
    }
  }

  const confirmLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Clear any cached data
      workflowCache.clearCache()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
      showAlert(
        'Error',
        'Failed to logout. Please try again.'
      )
    }
  }

  // Update the chatbot and widget click handlers
  const handleChatbotClick = () => {
    if (!currentWorkflowId) {
      console.error('No workflow ID found')
      return
    }
    handleNavigationWithCheck(`/chat/${currentWorkflowId}`)
  }

  const handleWidgetClick = () => {
    if (!currentWorkflowId) {
      console.error('No workflow ID found')
      return
    }
    handleNavigationWithCheck(`/widget/${currentWorkflowId}`)
  }

  // Add this at the component level
  useEffect(() => {
    // Handle browser navigation/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Add these handlers
  const handleFAQClick = () => {
    if (!currentWorkflowId) return
    handleNavigationWithCheck(`/faq/${currentWorkflowId}`)
  }

  const handleContextClick = () => {
    if (!currentWorkflowId) return
    handleNavigationWithCheck(`/context/${currentWorkflowId}`)
  }

  const handleNewWorkflowClick = () => {
    if (hasUnsavedChanges) {
      showAlert(
        'Unsaved Changes',
        'Would you like to save your changes before creating a new workflow?',
        'success'
      )
      setPendingNavigation('/builder')
    } else {
      addNewWorkflow()
    }
  }

  // Add this handler for saved workflow selection
  const handleSavedWorkflowClick = (selectedWorkflowId: string) => {
    if (hasUnsavedChanges) {
      showAlert(
        'Unsaved Changes',
        'Would you like to save your changes before switching workflows?',
        'success'
      )
      setPendingNavigation(`/builder/${selectedWorkflowId}`)
    } else {
      handleWorkflowSelect(selectedWorkflowId)
    }
  }

  // Add this near the top with other state declarations
  const [copiedNode, setCopiedNode] = useState<Node | null>(null)

  // Add this effect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

      if (cmdOrCtrl && event.key === 'c') {
        // Get the selected node
        const selectedNode = nodes.find(node => node.selected)
        if (selectedNode && selectedNode.type !== 'start') {
          // Create a copy without position and with new ID
          const nodeCopy = {
            ...selectedNode,
            id: generateUniqueId(selectedNode.type || 'default'),
            position: { ...selectedNode.position },  // We'll adjust this when pasting
            data: { ...selectedNode.data }
          }
          setCopiedNode(nodeCopy)
        }
      }

      if (cmdOrCtrl && event.key === 'v' && copiedNode) {
        // Get the current viewport center
        const { x, y } = reactFlowInstance.getViewport()
        const center = reactFlowInstance.project({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        })

        // Create new node with offset from original
        const newNode = {
          ...copiedNode,
          id: generateUniqueId(copiedNode.type || 'default'),
          position: {
            x: center.x + 50,  // Add offset to avoid exact overlap
            y: center.y + 50
          }
        }

        setNodes(nds => [...nds, newNode])
        setHasUnsavedChanges(true)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [nodes, copiedNode, reactFlowInstance, setNodes])

  // Add this effect to handle initial state when landing on /builder
  useEffect(() => {
    // If we're on /builder (no workflowId), reset to initial state
    if (!workflowId) {
      setNodes(initialNodes)
      setEdges([])
      setWorkflowName('My Workflow')
      setCurrentWorkflow(null)
      setCurrentWorkflowId(undefined)
      setHasUnsavedChanges(false)
      
      // Reset refs
      initialNodesRef.current = initialNodes
      initialEdgesRef.current = []
      initialNameRef.current = 'My Workflow'
    }
  }, [workflowId, setNodes, setEdges])

  const handlePasteNode = () => {
    if (copiedNode && reactFlowInstance) {
      const { x, y } = reactFlowInstance.getViewport()
      const center = reactFlowInstance.project({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      })
      
      const newNode = {
        ...copiedNode,
        id: generateUniqueId(copiedNode.type || 'default'),
        position: {
          x: center.x + 50,  // Add offset to avoid exact overlap
          y: center.y + 50
        }
      }
      setNodes((nds) => nds.concat(newNode))
    }
  }

  // Add this function to handle sample workflow click
  const handleSampleWorkflowClick = async () => {
    try {
      if (hasUnsavedChanges) {
        showAlert(
          'Unsaved Changes',
          'Would you like to save your changes before creating a copy of the sample workflow?',
          'success'
        )
        setPendingNavigation('sample')
        return
      }

      setIsLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check workflow limit for non-admin users
      if (!isAdmin(user.id)) {
        // Get user's current tier
        const { data: userTier } = await supabase
          .from('user_tiers')
          .select('pricing_tier')
          .eq('user_id', user.id)
          .single()

        const currentTier = userTier?.pricing_tier || 'hobbyist'
          const tierLimit = TIER_LIMITS[currentTier as keyof typeof TIER_LIMITS]

          // Count user's existing workflows
          const { count } = await supabase
            .from('workflows')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if (count && count >= tierLimit) {
            throw new Error(`You have reached the maximum number of workflows (${tierLimit}) for your current tier. Please upgrade to create more workflows.`)
        }
      }

      // 1. Fetch sample workflow data
      const { data: sampleWorkflow, error: workflowError } = await supabase
        .from('sample_workflows')
        .select('*')
        .eq('id', SAMPLE_WORKFLOW_ID)
        .single()

      if (workflowError) throw workflowError

      // 2. Fetch sample FAQs
      const { data: sampleFaqs, error: faqError } = await supabase
        .from('sample_faqs')
        .select('*')
        .eq('workflow_id', SAMPLE_WORKFLOW_ID)

      if (faqError) throw faqError

      // 3. Create new workflow with sample data
      const { data: newWorkflow, error: createError } = await supabase
        .from('workflows')
        .insert({
          name: `${sampleWorkflow.name} Copy`,
          nodes: sampleWorkflow.nodes,
          edges: sampleWorkflow.edges,
          context: sampleWorkflow.context,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      // 4. Create FAQs for the new workflow
      if (sampleFaqs?.length > 0) {
        const newFaqs = sampleFaqs.map(faq => ({
          question: faq.question,
          answer: faq.answer,
          workflow_id: newWorkflow.id,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: faqCreateError } = await supabase
          .from('faqs')
          .insert(newFaqs)

        if (faqCreateError) throw faqCreateError
      }

      // 5. Update cache and UI
      workflowCache.setWorkflow(newWorkflow)
      
      // Update workflow list cache
      const listCache = workflowCache.getWorkflowList()
      if (listCache) {
        const updatedList = [...listCache, { 
          id: newWorkflow.id, 
          name: newWorkflow.name, 
          updated_at: newWorkflow.updated_at 
        }]
        workflowCache.setWorkflowList(updatedList)
      }

      // Emit event to update SavedWorkflows
      eventEmitter.emit('workflowUpdated', {
        id: newWorkflow.id,
        name: newWorkflow.name,
        updated_at: newWorkflow.updated_at
      })

      // Show success message and navigate
      showAlert(
        'Success! 🎉',
        'Sample workflow has been copied to your account.',
        'success',
        () => router.push(`/builder/${newWorkflow.id}`)
      )

    } catch (error) {
      console.error('Error copying sample workflow:', error)
      if (error instanceof Error) {
        if (error.message.includes('You have reached the maximum number of workflows')) {
          showAlert('Error', error.message)
        } else {
          showAlert('Error', 'Failed to copy sample workflow')
        }
      } else {
        showAlert('Error', 'Failed to copy sample workflow')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {isAdminMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-yellow-800 font-semibold">
          Admin Mode - Changes will be saved to sample workflows
        </div>
      )}
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
            onNewWorkflow={handleNewWorkflowClick}
            workflowId={currentWorkflowId}
            isCreating={isCreating}
            onSaveWorkflow={saveWorkflow}
            onChatbotClick={handleChatbotClick}
            onWidgetClick={handleWidgetClick}
            onFAQClick={handleFAQClick}
            onContextClick={handleContextClick}
          />
          <SavedWorkflows onWorkflowSelect={handleSavedWorkflowClick} />
        </div>
        <div className="flex-grow flex flex-col ml-64 relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Loading workflow...</div>
            </div>
          ) : (
            <>
              <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                {!isAdminMode && (
                  <Button
                    onClick={handleSampleWorkflowClick}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
                  >
                    <BookOpen className="h-4 w-4" />
                    Sample Workflow
                  </Button>
                )}
                <Button
                  onClick={() => handleNavigationWithCheck('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  onClick={() => handleNavigationWithCheck('/')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
                <Button
                  onClick={handleLogout}
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
                  <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
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
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleChatbotClick}
                    disabled={!currentWorkflowId}
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    See Live Chatbot
                  </Button>
                    <Button
                      onClick={handleWidgetClick}
                      disabled={!currentWorkflowId}
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
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertMessage?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertMessage?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertMessage?.type === 'navigation' ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleAlertAction}
                  variant="destructive"
                >
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPendingNavigation(null)
                    setAlertOpen(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : alertMessage?.type === 'success' && pendingNavigation ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleAlertAction}
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    'Save & Continue'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (pendingNavigation) {
                      router.push(pendingNavigation)
                    }
                    setPendingNavigation(null)
                    setAlertOpen(false)
                  }}
                  disabled={isSaving}
                >
                  Don't Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPendingNavigation(null)
                    setAlertOpen(false)
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <AlertDialogAction 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  setAlertOpen(false)
                  if (alertMessage?.onClose) {
                    alertMessage.onClose()
                  }
                }}
              >
                OK
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Create a wrapper component to handle initialization
const WorkflowEditorWrapper = ({ workflowId }: WorkflowEditorProps) => {
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