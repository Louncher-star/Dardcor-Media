import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { status: 'error', message: 'Supabase credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        { status: 'warning', error: error.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase database pinged successfully to prevent auto-pause',
      timestamp: new Date().toISOString(),
      count: data?.length ?? 0,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
