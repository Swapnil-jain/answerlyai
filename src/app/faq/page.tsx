import FAQUpload from '@/components/workflow-editor/FAQUpload'
import Header from '@/components/header'

export default function FAQPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header className="z-50" />
      <div className="flex-1 h-[calc(100vh-64px)]">
        <FAQUpload />
      </div>
    </div>
  )
} 