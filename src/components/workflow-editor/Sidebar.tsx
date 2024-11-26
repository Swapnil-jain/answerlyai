export default function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="w-64 bg-gray-100 p-4 mt-16">
      <h2 className="text-lg font-bold mb-4">Node Types</h2>
      <div
        className="bg-white p-2 mb-2 rounded cursor-move"
        onDragStart={(event) => onDragStart(event, 'start')}
        draggable
      >
        Start
      </div>
      <div
        className="bg-white p-2 mb-2 rounded cursor-move"
        onDragStart={(event) => onDragStart(event, 'decision')}
        draggable
      >
        Decision
      </div>
      <div
        className="bg-white p-2 mb-2 rounded cursor-move"
        onDragStart={(event) => onDragStart(event, 'action')}
        draggable
      >
        Action
      </div>
    </aside>
  )
}

