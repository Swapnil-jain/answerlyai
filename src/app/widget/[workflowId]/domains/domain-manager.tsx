'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSupabase } from '@/lib/supabase/provider';

interface DomainManagerProps {
  workflowId: string;
  initialDomains: string[];
}

export default function DomainManager({ workflowId, initialDomains }: DomainManagerProps) {
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [newDomain, setNewDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [deletingDomains, setDeletingDomains] = useState<Set<string>>(new Set());
  const { supabase } = useSupabase();
  const [session, setSession] = useState<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSession(session.access_token);
      }
    };
    getSession();
  }, [supabase.auth]);

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !session) return;

    setIsAddingDomain(true);
    try {
      const response = await fetch(`/api/workflow/${workflowId}/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add domain');
      }

      setDomains([...domains, newDomain.trim()]);
      setNewDomain('');
      toast.success('Domain added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add domain');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const removeDomain = async (domain: string) => {
    if (!session) return;
    
    setDeletingDomains(prev => new Set([...prev, domain]));
    try {
      const response = await fetch(`/api/workflow/${workflowId}/domains`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove domain');
      }

      setDomains(domains.filter(d => d !== domain));
      toast.success('Domain removed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove domain');
    } finally {
      setDeletingDomains(prev => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addDomain} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Enter domain (e.g., example.com)"
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isAddingDomain}
          />
          <button
            type="submit"
            disabled={isAddingDomain || !newDomain.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingDomain ? 'Adding...' : 'Add Domain'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Current Domains</h3>
        {domains.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed">
            <p className="text-gray-500">No domains added yet. Widget will work on any website.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {domains.map((domain) => (
              <div
                key={domain}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md group hover:bg-gray-100"
              >
                <span className="text-gray-700 font-mono">{domain}</span>
                <button
                  onClick={() => removeDomain(domain)}
                  disabled={deletingDomains.has(domain)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  {deletingDomains.has(domain) ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
