import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ tier: 'free' }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-Assistant-Name',
        }
      });
    }

    const { data: tierData } = await supabase
      .from('user_tiers')
      .select('pricing_tier')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({ 
      tier: tierData?.pricing_tier || 'free'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-Assistant-Name',
      }
    });
  } catch (error) {
    console.error('Error checking user tier:', error);
    return NextResponse.json({ tier: 'free' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-Assistant-Name',
      }
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-Assistant-Name',
    },
  });
}
