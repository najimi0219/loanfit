// app/api/housing-loans/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 🔥 環境変数の取得と検証
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('環境変数が設定されていません:', {
        url: !!supabaseUrl,
        key: !!supabaseServiceKey
      });
      throw new Error('Supabase環境変数が設定されていません');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('housing_loans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET処理エラー:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('=== 更新処理開始 ===');
    console.log('更新ID:', id);

    // 🔥 環境変数の取得と検証
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('環境変数が設定されていません:', {
        url: !!supabaseUrl,
        key: !!supabaseServiceKey
      });
      throw new Error('Supabase環境変数が設定されていません');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 更新データの準備（idとcreated_atを除外）
    const { id: _, created_at, ...updateData } = body;

    console.log('実際の更新データ:', updateData);

    // データ更新
    const { data, error } = await supabase
      .from('housing_loans')
      .update(updateData)
      .eq('id', id)
      .select();

    console.log('更新結果:', data);
    console.log('更新エラー:', error);

    if (error) {
      console.error('Supabaseエラー詳細:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('更新されたデータが見つかりません');
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error('PUT処理エラー:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 🔥 環境変数の取得と検証
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('環境変数が設定されていません');
      throw new Error('Supabase環境変数が設定されていません');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('housing_loans')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: '削除しました' });
  } catch (error: any) {
    console.error('DELETE処理エラー:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}