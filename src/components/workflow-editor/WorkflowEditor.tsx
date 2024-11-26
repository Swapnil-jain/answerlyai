'use client'

import React, { useState, useCallback } from 'react'
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
import 'reactflow/dist/style.css'

import StartNode from './nodes/StartNode'
import DecisionNode from './nodes/DecisionNode'
import ActionNode from './nodes/ActionNode'
import Sidebar from './Sidebar'
import TestingPanel from './TestingPanel'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'

const nodeTypes = {
  start: StartNode,
  decision: DecisionNode,
  action: ActionNode,
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

// Create a new component for the flow content
function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [workflowName, setWorkflowName] = useState('My Workflow')
  const reactFlowInstance = useReactFlow()
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingAPI, setIsTestingAPI] = useState(false)

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

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

  const saveWorkflow = async () => {
    if (isSaving) return

    try {
      setIsSaving(true)
      validateWorkflow()

      const workflow = {
        name: workflowName,
        nodes: nodes,
        edges: edges,
      }

      console.log('Sending workflow:', workflow) // Debug log

      const response = await fetch(`${window.location.origin}/api/save-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      })

      const data = await response.json()
      console.log('Response:', data) // Debug log

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        alert(`Workflow saved successfully! ID: ${data.workflowId}`)
      } else {
        throw new Error(data.message || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert('Failed to save workflow: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  const testAPIConnection = async () => {
    try {
      setIsTestingAPI(true)
      const response = await fetch(`${window.location.origin}/api/save-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      })
      const data = await response.json()
      console.log('API Test Response:', data)
      alert('API connection test completed. Check console for details.')
    } catch (error) {
      console.error('API Test Error:', error)
      alert('API test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsTestingAPI(false)
    }
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
    <div className="flex h-[calc(100vh-64px)]">
      <Header />
      <Sidebar />
      <div className="flex-grow">
        <div className="h-[calc(100vh-104px)]">
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
        <div className="flex justify-between items-center p-2 bg-gray-100">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <div className="flex gap-2">
            <Button 
              onClick={testAPIConnection}
              disabled={isTestingAPI}
              variant="outline"
            >
              {isTestingAPI ? 'Testing...' : 'Test API'}
            </Button>
            <Button 
              onClick={saveWorkflow} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Workflow'}
            </Button>
          </div>
        </div>
      </div>
      <TestingPanel nodes={nodes} edges={edges} />
    </div>
  )
}

// Main component that provides the ReactFlow context
export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}