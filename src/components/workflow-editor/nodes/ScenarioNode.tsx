import { Handle, Position } from 'reactflow'
import { useState } from 'react'

interface ScenarioNodeProps {
  data: {
    label: string
  }
  id: string
}

export default function ScenarioNode({ data, id }: ScenarioNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label)

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    data.label = label || 'Scenario'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      data.label = label || 'Scenario'
    }
  }

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-500 min-w-[150px] min-h-[40px]">
      <div className="flex flex-col">
        <div className="text-xs font-bold text-yellow-700 mb-1">Scenario</div>
        {isEditing ? (
          <textarea
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="text-sm bg-yellow-50 border border-yellow-300 rounded p-1"
            placeholder="Enter scenario..."
            autoFocus
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className="text-sm text-gray-700 break-words"
          >
            {label || 'Scenario'}
          </div>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="scenario-out"
        style={{ background: '#FFB84C' }}
        isValidConnection={(connection) => {
          return connection.targetHandle?.includes('scenario-in') ?? false
        }}
      />
    </div>
  )
} 