import Image from 'next/image'

export default function WorkflowDemoSection() {
  return (
    <section className="w-full py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Visual Workflow Builder</h2>
          <p className="text-xl text-gray-600">Create complex AI agent flows with our intuitive drag-and-drop interface</p>
        </div>
        <div className="max-w-[1200px] 2xl:max-w-[1400px] mx-auto">
          <div className="relative rounded-xl overflow-hidden shadow-2xl">
            <Image
              src="/main.png"
              alt="AnswerlyAI Workflow Builder Demo"
              width={1400}
              height={933}
              className="w-full"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
