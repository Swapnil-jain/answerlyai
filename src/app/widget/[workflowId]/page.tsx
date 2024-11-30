'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyIcon, CheckIcon, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function WidgetPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const [copied, setCopied] = useState(false);
  
  // Get the base URL, fallback to window.location if env var is not set
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || '';
  };
  
  const widgetCode = `<script src="${getBaseUrl()}/api/widget/${workflowId}"></script>
<script>
    window.addEventListener('AnswerlyAIWidgetReady', function() {
        window.AnswerlyAIWidget.init({
            theme: 'blue',
            position: 'bottom-right'
        });
    });
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <Link href={`/builder/${workflowId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Embed Your Chat Widget</h1>
      </div>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          Add this code to your website to embed the chat widget. Place it just before the closing <code>&lt;/body&gt;</code> tag:
        </p>
        
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg mb-4 overflow-x-auto">
            <code className="text-sm">{widgetCode}</code>
          </pre>
          
          <Button 
            onClick={copyToClipboard}
            className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700"
            size="sm"
          >
            {copied ? (
              <><CheckIcon className="h-4 w-4 mr-2" /> Copied!</>
            ) : (
              <><CopyIcon className="h-4 w-4 mr-2" /> Copy Code</>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="customize" className="mb-8">
        <TabsList>
          <TabsTrigger value="customize">Customization</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customize">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customization Options</h3>
            <p className="text-gray-600">You can customize the widget by passing options to the init function:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
              <li><code>theme</code>: 'blue' (default) or 'light'</li>
              <li><code>position</code>: 'bottom-right' (default) or 'bottom-left'</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="options">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Options</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
              <li>The widget is responsive and works on all devices</li>
              <li>Supports both light and dark mode</li>
              <li>Automatically handles chat history</li>
              <li>Maintains conversation context</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="testing">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Testing Your Widget</h3>
            <p className="text-gray-600">To test the widget locally:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 ml-4">
              <li>Create a new HTML file</li>
              <li>Paste the widget code before the closing body tag</li>
              <li>Open the file in a web browser</li>
              <li>You should see the chat button in the bottom-right corner</li>
            </ol>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="font-semibold mb-4">Important Notes:</h2>
        <ul className="list-disc list-inside space-y-3 text-sm text-gray-600">
          <li>The chat widget appears as a floating button in the corner of your website</li>
          <li>The widget connects securely to our servers to process messages</li>
          <li>Your workflow configuration and FAQs are automatically loaded</li>
          <li>Keep your workflow ID private and secure</li>
          <li>The widget automatically adapts to your website's layout</li>
        </ul>
      </div>
    </div>
  );
} 