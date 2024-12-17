import { createClient } from '@supabase/supabase-js';
import DomainManager from './domain-manager';
import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';

interface PageProps {
  params: Promise<{ workflowId: string }>;
}

export default async function DomainsPage({ params }: PageProps) {
  const { workflowId } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch initial domains
  const { data: domains } = await supabase
    .from('allowed_domains')
    .select('domain')
    .eq('workflow_id', workflowId);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Domain Settings</h1>
            <p className="text-xl text-gray-600">Control which websites can use your widget</p>
          </div>
          <Link
            href={`/widget/${workflowId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Widget
          </Link>
        </div>

        <div className="bg-blue-50 p-8 rounded-2xl mb-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">How Domain Control Works</h2>
              <p className="text-gray-600 mb-4">
                Add the domains where you want to use this widget. If no domains are added, 
                the widget will work on any website.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg border">
                  <p className="font-medium mb-2">Exact Domain Match</p>
                  <code className="text-sm bg-gray-50 px-2 py-1 rounded">example.com</code>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="font-medium mb-2">With Subdomains</p>
                  <code className="text-sm bg-gray-50 px-2 py-1 rounded">*.example.com</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border">
          <div className="p-6">
            <DomainManager 
              workflowId={workflowId}
              initialDomains={domains?.map(d => d.domain) || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
