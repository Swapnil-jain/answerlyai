'use client';

import { useParams } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyIcon, CheckIcon, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WidgetPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;
  const [copied, setCopied] = useState(false);
  const { supabase } = useSupabase();
  const [userId, setUserId] = useState<string>('');
  
  // Get the current user's ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, [supabase.auth]);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : '');
  
  const widgetCode = `<script src="${baseUrl}/api/widget/${workflowId}"></script>
<script>
    window.addEventListener('AnswerlyAIWidgetReady', function() {
        window.AnswerlyAIWidget.init({
            name: 'Cora',
            theme: 'blue',
            position: 'bottom-right',
            userId: '${userId}'
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
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customize">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customization Options</h3>
            <p className="text-gray-600">You can customize the widget by passing options to the init function:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
              <li><code>name</code>: Assistant name (defaults to 'Cora')</li>
              <li>
                <code>theme</code>: Color theme for the widget button (defaults to 'blue')
                <ul className="list-disc list-inside ml-6 mt-2 text-gray-500">
                  <li>'violet' - <span className="w-3 h-3 inline-block bg-violet-600 rounded-full"></span></li>
                  <li>'indigo' - <span className="w-3 h-3 inline-block bg-indigo-600 rounded-full"></span></li>
                  <li>'blue' - <span className="w-3 h-3 inline-block bg-blue-600 rounded-full"></span></li>
                  <li>'green' - <span className="w-3 h-3 inline-block bg-green-600 rounded-full"></span></li>
                  <li>'yellow' - <span className="w-3 h-3 inline-block bg-yellow-500 rounded-full"></span></li>
                  <li>'orange' - <span className="w-3 h-3 inline-block bg-orange-500 rounded-full"></span></li>
                  <li>'red' - <span className="w-3 h-3 inline-block bg-red-600 rounded-full"></span></li>
                  <li>'dark' - <span className="w-3 h-3 inline-block bg-gray-800 rounded-full"></span></li>
                </ul>
              </li>
              <li><code>position</code>: 'bottom-right' (default) or 'bottom-left'</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The widget supports VIBGYOR color themes (Violet, Indigo, Blue, Green, Yellow, Orange, Red) 
                plus a 'dark' theme. Choose the color that best matches your website's design.
              </p>
            </div>
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
          <li>The chat widget appears as a floating button in the corner of your website.</li>
          <li>The widget connects securely to our servers to process messages.</li>
          <li>All the confiugrations are automatically loaded. You do not need to do anything.</li>
          <li>Keep your workflow ID & userId private and secure.</li>
          <li>The widget automatically adapts to your website's layout across devices.</li>
          <li>Do not edit the userId/workflow ID as widget will immediately stop working.</li>
        </ul>
      </div>
    </div>
  );
} 