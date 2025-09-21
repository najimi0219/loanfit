// app/api/housing-loans/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'interest_rate';
    const order = searchParams.get('order') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // 住宅ローンデータを取得（金利順でソート）
    const { data, error } = await supabase
      .from("housing_loans")
      .select(`
        id,bank_name,min_annual_income_man_yen,max_loan_amount,interest_type,interest_rate,screening_rate,preliminary_screening_method,max_repayment_age,max_loan_period_years,debt_ratio_0_399,debt_ratio_400_plus,general_group_insurance,general_group_insurance_features,wide_group_insurance,wide_group_insurance_conditions,cancer_group_insurance_100,cancer_group_insurance_100_notes,three_major_diseases_plus,three_major_diseases_plus_conditions,general_insurance_non_participation,employment_regular_months,employment_regular_months_notes,employment_contract_months,employment_contract_months_notes,employment_dispatch_months,employment_dispatch_months_notes,representative,representative_notes,self_employed,self_employed_notes,maternity_paternity_leave,maternity_paternity_leave_notes,single_person,single_person_notes,family_residential_loan,no_permanent_residency,permanent_residency_notes,lgbtq,lgbtq_notes,pre_marriage_consolidation,common_law_marriage,pair_loan,pair_loan_notes,income_consolidation_joint_liability,income_consolidation_joint_liability_notes,income_consolidation_joint_guarantee,income_consolidation_joint_guarantee_notes,consolidation_employment_type,consolidation_employment_type_notes,ms_area_limit_sqm,over_25_years_old,old_earthquake_standards,old_earthquake_standards_notes,outside_urbanization_area,leasehold,leasehold_notes,non_rebuildable,non_rebuildable_notes,existing_non_conforming,existing_non_conforming_notes,self_management,self_management_notes,various_expenses,various_expenses_notes,renovation,renovation_notes,property_exchange,property_exchange_notes,bridge_loan,bridge_loan_notes,debt_consolidation_loan,debt_consolidation_loan_notes,special_handling,features,created_at,updated_at

      `)
      .order(sortBy, { ascending: order === 'asc' })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      data: data || [],
      count: data?.length || 0
    });
    
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// 新しい住宅ローン商品を追加
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from("housing_loans")
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
    
  } catch (err: any) {
    console.error('POST error:', err);
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }
}