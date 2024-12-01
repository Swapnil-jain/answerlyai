import { Handle, Position } from 'reactflow'
import { useState } from 'react'
import { NodeResizer } from 'reactflow'

interface ScenarioNodeProps {
  data: {
    label: string
  }
  id: string
  selected: boolean
}

export default function ScenarioNode({ data, id, selected }: ScenarioNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label)

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    data.label = label || 'Scenario'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !event.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
      data.label = label || 'Scenario'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLabel(e.target.value)
  }

  return (
    <div className="relative">
      <NodeResizer 
        minWidth={150}
        minHeight={50}
        isVisible={selected}
        lineClassName="border-yellow-500"
        handleClassName="h-3 w-3 bg-yellow-500"
      />
      <div className="px-4 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-500 w-full h-full min-w-[150px] min-h-[50px]">
        <div className="flex flex-col">
          <div className="text-xs font-bold text-yellow-700 mb-1">Scenario</div>
          {isEditing ? (
            <textarea
              value={label}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-sm bg-yellow-50 border border-yellow-300 rounded p-1 w-full resize-none"
              placeholder="Enter scenario..."
              autoFocus
              style={{ minHeight: '60px' }}
            />
          ) : (
            <div
              onDoubleClick={handleDoubleClick}
              className="text-sm text-gray-700 whitespace-pre-wrap break-words"
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
    </div>
  )
} 