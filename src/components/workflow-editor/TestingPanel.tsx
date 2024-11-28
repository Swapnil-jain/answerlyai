import React, { useState } from 'react'
import { Node, Edge } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TestingPanelProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
}

interface SimulationStep {
  nodeId: string
  label: string
  type: string
  result?: string
}

export default function TestingPanel({ 
  nodes, 
  edges,
  onNodesChange,
  onEdgesChange 
}: TestingPanelProps) {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [waitingForInput, setWaitingForInput] = useState(false)
  const [currentDecision, setCurrentDecision] = useState<Node | null>(null)

  // Helper function to find next node
  const findNextNode = (currentNodeId: string, answer: 'yes' | 'no' = 'yes') => {
    const edge = edges.find(
      (edge) => 
        edge.source === currentNodeId && 
        (edge.sourceHandle === answer || edge.sourceHandle === null)
    )
    return edge ? nodes.find(node => node.id === edge.target) : null
  }

  const startSimulation = () => {
    setIsSimulating(true)
    setSimulationSteps([])
    setCurrentStep(0)
    
    // Find start node
    const startNode = nodes.find((node) => node.type === 'start')
    if (!startNode) {
      alert('No start node found')
      return
    }

    // Add start node to simulation steps
    setSimulationSteps([{
      nodeId: startNode.id,
      label: startNode.data.label,
      type: startNode.type
    }])

    // Find first node after start
    const nextNode = findNextNode(startNode.id)
    if (nextNode) {
      if (nextNode.type === 'decision') {
        setCurrentDecision(nextNode)
        setWaitingForInput(true)
      } else {
        continueSimulation(nextNode)
      }
    }
  }

  const handleDecision = (answer: 'yes' | 'no') => {
    if (!currentDecision) return

    // Add decision to simulation steps
    setSimulationSteps(prev => [...prev, {
      nodeId: currentDecision.id,
      label: currentDecision.data.label,
      type: currentDecision.type,
      result: answer
    }])

    // Find next node based on decision
    const nextNode = findNextNode(currentDecision.id, answer)
    setCurrentDecision(null)
    setWaitingForInput(false)

    if (nextNode) {
      if (nextNode.type === 'decision') {
        setCurrentDecision(nextNode)
        setWaitingForInput(true)
      } else {
        continueSimulation(nextNode)
      }
    } else {
      setIsSimulating(false)
    }
  }

  const continueSimulation = (node: Node) => {
    setSimulationSteps(prev => [...prev, {
      nodeId: node.id,
      label: node.data.label,
      type: node.type
    }])

    const nextNode = findNextNode(node.id)
    if (nextNode) {
      if (nextNode.type === 'decision') {
        setCurrentDecision(nextNode)
        setWaitingForInput(true)
      } else {
        continueSimulation(nextNode)
      }
    } else {
      setIsSimulating(false)
    }
  }

  const resetSimulation = () => {
    setIsSimulating(false)
    setWaitingForInput(false)
    setCurrentDecision(null)
    setSimulationSteps([])
    setCurrentStep(0)
  }

  return (
    <aside className="w-64 bg-gray-100 p-4 mt-16 border-l border-gray-200 min-h-[calc(100vh-64px)]">
      <h2 className="text-lg font-bold mb-4">Testing Panel</h2>
      
      {!isSimulating ? (
        <Button 
          onClick={startSimulation} 
          className="w-full mb-4"
        >
          Start Testing
        </Button>
      ) : (
        <Button 
          onClick={resetSimulation} 
          variant="outline"
          className="w-full mb-4"
        >
          Reset Test
        </Button>
      )}

      {/* Current Decision Interface */}
      {waitingForInput && currentDecision && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-medium mb-2">Decision Required:</h3>
          <p className="mb-3 text-sm">{currentDecision.data.label}</p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleDecision('yes')}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleDecision('no')}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              No
            </Button>
          </div>
        </div>
      )}

      {/* Simulation Steps Display */}
      <div className="bg-white p-3 rounded">
        <h3 className="font-bold mb-2">Simulation Path:</h3>
        <div className="space-y-2">
          {simulationSteps.map((step, index) => (
            <div 
              key={index}
              className={`p-2 rounded ${
                step.type === 'start' ? 'bg-gray-100' :
                step.type === 'decision' ? 'bg-blue-100' :
                'bg-green-100'
              }`}
            >
              <div className="font-medium text-sm">{step.label}</div>
              {step.result && (
                <div className={`text-sm mt-1 ${
                  step.result === 'yes' ? 'text-green-600' : 'text-red-600'
                }`}>
                  Answer: {step.result}
                </div>
              )}
              {index < simulationSteps.length - 1 && (
                <div className="text-center text-gray-400 my-1">↓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

