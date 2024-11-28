export default function PlaceholderImage({ width, height }: { width: number; height: number }) {
  return (
    <div 
      className="bg-gray-200 flex items-center justify-center"
      style={{ width, height }}
    >
      <span className="text-gray-400">
        {width} x {height}
      </span>
    </div>
  )
} 