import { useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

export default function DecisionNode({ id, data, isConnectable }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label)

  const onLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLabel(event.target.value)
    },
    []
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setIsEditing(false)
        data.label = label
      }
    },
    [data, label]
  )

  return (
    <div className="relative">
      {/* Main node content */}
      <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500">
        {/* Input handle at the top */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-blue-500"
          isConnectable={isConnectable}
        />
        
        {/* Node label */}
        {isEditing ? (
          <input
            type="text"
            value={label}
            onChange={onLabelChange}
            onKeyDown={onKeyDown}
            onBlur={() => {
              setIsEditing(false)
              data.label = label
            }}
            className="font-bold text-blue-500 bg-transparent border-none outline-none text-center w-full"
            autoFocus
          />
        ) : (
          <div
            className="font-bold text-blue-500 min-w-[150px] min-h-[40px] flex items-center justify-center"
            onDoubleClick={() => setIsEditing(true)}
          >
            {data.label}
          </div>
        )}
      </div>

      {/* Yes/No connection points with better visual indicators */}
      <div className="mt-4 flex justify-center items-center gap-12">
        {/* Yes branch */}
        <div className="flex flex-col items-center">
          <div className="bg-green-100 rounded-md px-3 py-1 text-sm text-green-700 font-medium mb-1">
            Yes
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className="!w-3 !h-3 !bg-green-500"
            isConnectable={isConnectable}
            style={{ position: 'relative', bottom: '-8px' }}
          />
        </div>

        {/* No branch */}
        <div className="flex flex-col items-center">
          <div className="bg-red-100 rounded-md px-3 py-1 text-sm text-red-700 font-medium mb-1">
            No
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className="!w-3 !h-3 !bg-red-500"
            isConnectable={isConnectable}
            style={{ position: 'relative', bottom: '-8px' }}
          />
        </div>
      </div>
    </div>
  )
}

