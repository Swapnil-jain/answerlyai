import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TIER_LIMITS } from '@/lib/constants/tiers';
import { TierType } from '@/lib/utils/subscription';

interface RouteContext {
  params: Promise<{ workflowId: string }>;
}

// GET: List all allowed domains for a workflow
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { workflowId } = await context.params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) throw new Error('Not authenticated');

    // Verify user has access to this workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', workflowId)
      .single();

    if (workflowError) throw workflowError;

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found or access denied' },
        { status: 404 }
      );
    }

    const { data: domains, error: domainsError } = await supabase
      .from('allowed_domains')
      .select('domain')
      .eq('workflow_id', workflowId);

    if (domainsError) throw domainsError;

    return NextResponse.json({ domains: domains.map(d => d.domain) });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST: Add a new allowed domain
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;
    const { domain } = await request.json();
    
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Get user from token
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's tier
    const { data: userTier } = await supabase
      .from('user_tiers')
      .select('pricing_tier')
      .eq('user_id', user.id)
      .single();

    const tier = (userTier?.pricing_tier || 'free') as TierType;
    const tierLimit = TIER_LIMITS[tier];

    // Count existing domains
    const { count: domainCount } = await supabase
      .from('allowed_domains')
      .select('*', { count: 'exact' })
      .eq('workflow_id', workflowId);

    if (typeof domainCount === 'number' && domainCount >= tierLimit) {
      return NextResponse.json({
        error: `Your ${tier} plan is limited to ${tierLimit} domain${tierLimit === 1 ? '' : 's'}. Please upgrade to add more domains.`
      }, { status: 403 });
    }

    const { error: domainError } = await supabase
      .from('allowed_domains')
      .insert({
        workflow_id: workflowId,
        domain: domain.toLowerCase().trim()
      });

    if (domainError) {
      if (domainError.code === '23505') {
        return NextResponse.json(
          { error: 'Domain already exists for this workflow' },
          { status: 409 }
        );
      }
      throw domainError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding domain:', error);
    return NextResponse.json(
      { error: 'Failed to add domain' },
      { status: 500 }
    );
  }
}

// DELETE: Remove an allowed domain
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;
    const { domain } = await request.json();
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) throw new Error('Not authenticated');

    // Verify user has access to this workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', workflowId)
      .single();

    if (workflowError) throw workflowError;

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found or access denied' },
        { status: 404 }
      );
    }
    
    const { error: deleteError } = await supabase
      .from('allowed_domains')
      .delete()
      .eq('workflow_id', workflowId)
      .eq('domain', domain.toLowerCase().trim());

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing domain:', error);
    return NextResponse.json(
      { error: 'Failed to remove domain' },
      { status: 500 }
    );
  }
}
