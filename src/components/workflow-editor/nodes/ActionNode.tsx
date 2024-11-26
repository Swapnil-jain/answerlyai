import { useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

export default function ActionNode({ id, data, isConnectable }: NodeProps) {
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
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-red-500">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500"
      />
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
          className="font-bold text-red-500 bg-transparent border-none outline-none text-center w-full"
          autoFocus
        />
      ) : (
        <div
          className="font-bold text-red-500"
          onDoubleClick={() => setIsEditing(true)}
        >
          {data.label}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-red-500"
      />
    </div>
  )
}

