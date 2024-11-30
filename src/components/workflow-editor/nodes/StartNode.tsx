import { Handle, Position } from 'reactflow'

interface StartNodeProps {
  data: {
    label: string
  }
}

export default function StartNode({ data }: StartNodeProps) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-500 min-w-[150px] min-h-[40px] flex items-center justify-center">
      <div className="font-bold text-green-500 w-full text-center">
        Start
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  )
}

