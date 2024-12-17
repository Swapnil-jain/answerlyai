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
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link href={`/builder/${workflowId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Widget Configuration</h1>
          <p className="text-xl text-gray-600">
            Add a powerful AI chat widget to your website in minutes.
          </p>
        </div>

        <div className="bg-blue-50 p-8 rounded-2xl mb-12">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Installation Code</h2>
              <p className="text-gray-600">Add this code to your website just before the closing <code>&lt;/body&gt;</code> tag</p>
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex items-center gap-2"
            >
              {copied ? (
                <><CheckIcon className="h-4 w-4" /> Copied!</>
              ) : (
                <><CopyIcon className="h-4 w-4" /> Copy Code</>
              )}
            </Button>
          </div>
          <pre className="bg-white border rounded-xl p-6 overflow-x-auto">
            <code className="text-sm">{widgetCode}</code>
          </pre>
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Customize Your Widget</h2>
            <div className="bg-white p-6 rounded-xl border">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Available Options</h3>
                  <p className="text-gray-600 mb-4">
                    Customize your widget by passing these options to the init function:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <code className="text-sm bg-gray-50 px-2 py-1 rounded">name</code>
                      <p className="mt-1 text-gray-600">Assistant name (defaults to 'Cora')</p>
                    </div>
                    <div>
                      <code className="text-sm bg-gray-50 px-2 py-1 rounded">theme</code>
                      <p className="mt-1 text-gray-600">Color theme for the widget button (defaults to 'blue')</p>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { name: 'violet', color: '#7c3aed' },
                          { name: 'indigo', color: '#4f46e5' },
                          { name: 'blue', color: '#2563eb' },
                          { name: 'green', color: '#16a34a' },
                          { name: 'yellow', color: '#ca8a04' },
                          { name: 'orange', color: '#ea580c' },
                          { name: 'red', color: '#dc2626' },
                          { name: 'dark', color: '#1f2937' }
                        ].map(({ name, color }) => (
                          <div key={name} className="flex items-center gap-2">
                            <span 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: color }}
                            />
                            <code className="text-sm text-gray-600">{name}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <code className="text-sm bg-gray-50 px-2 py-1 rounded">position</code>
                      <p className="mt-1 text-gray-600">Widget position on the page</p>
                      <ul className="mt-2 space-y-1 text-gray-600">
                        <li><code className="text-sm">bottom-right</code> (default)</li>
                        <li><code className="text-sm">bottom-left</code></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Example:</strong>
                  </p>
                  <pre className="mt-2 text-sm bg-white p-3 rounded border overflow-x-auto">
                    <code>{`window.AnswerlyAIWidget.init({
  name: 'Support Bot',
  theme: 'violet',
  position: 'bottom-right'
});`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
            <div className="bg-white p-6 rounded-xl border">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium mb-1">Domain Access Control</h3>
                  <p className="text-gray-600">Manage which websites can use your widget</p>
                </div>
                <Link href={`/widget/${workflowId}/domains`}>
                  <Button>Manage Domains</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border">
            <h2 className="font-semibold mb-4">Important Notes:</h2>
            <ul className="grid gap-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                <span>The widget connects securely to our servers to process messages.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                <span>All the configurations are automatically loaded. You do not need to do anything. </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                <span>The chat widget appears as a floating button in the corner of your website and adapts to all layouts across devices.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}