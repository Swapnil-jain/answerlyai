import { useState, useCallback } from 'react'
import { Handle, Position, NodeProps, NodeResizeControl } from 'reactflow'
import { NodeResizer } from 'reactflow'

interface ActionNodeData {
  label: string
}

export default function ActionNode({ id, data, isConnectable, selected }: NodeProps<ActionNodeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label)

  const onLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLabel(event.target.value)
    },
    []
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        setIsEditing(false)
        data.label = label || 'Action'
      }
    },
    [data, label]
  )

  return (
    <div className="relative">
      <NodeResizer 
        minWidth={150}
        minHeight={50}
        isVisible={selected}
        lineClassName="border-red-500"
        handleClassName="h-3 w-3 bg-red-500"
      />
      <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-red-500 w-full h-full min-w-[150px] min-h-[50px] flex items-center justify-center">
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-red-500"
        />
        {isEditing ? (
          <textarea
            value={label}
            onChange={onLabelChange}
            onKeyDown={onKeyDown}
            onBlur={() => {
              setIsEditing(false)
              data.label = label || 'Action'
            }}
            className="font-bold text-red-500 bg-transparent border-none outline-none text-center w-full resize-none"
            autoFocus
            placeholder="Enter action..."
            style={{ minHeight: '60px' }}
          />
        ) : (
          <div
            className="font-bold text-red-500 w-full h-full flex items-center justify-center whitespace-pre-wrap break-words text-center"
            onDoubleClick={() => setIsEditing(true)}
          >
            {label || 'Action'}
          </div>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-red-500"
        />
      </div>
    </div>
  )
}

