import { NextRequest, NextResponse } from 'next/server';

// Supabaseクライアントをインポート（既存の設定を使用）
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 問い合わせ先情報を取得
    const { data, error } = await supabase
      .from('housing_loans')
      .select('id, bank_name, contact_person, contact_phone, contact_email, contact_hours, contact_notes')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contact information' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Bank not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}