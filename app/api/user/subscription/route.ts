import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clerkUserId = searchParams.get('clerk_user_id');

  if (!clerkUserId) {
    return NextResponse.json({ error: 'clerk_user_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('plan_type, payment_status, upgraded_at')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}