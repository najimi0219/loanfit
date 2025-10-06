// types/housing-loan.ts

export interface HousingLoan {
    id: string;
    bank_name: string;
    min_annual_income_man_yen: number | null;
    max_loan_amount: number | null;
    interest_type: string | null;
    interest_rate: number | null;
    screening_rate: number | null;
    preliminary_screening_method: string | null;
    max_repayment_age: number | null;
    max_loan_period_years: number | null;
    debt_ratio_0_399: number | null;
    debt_ratio_400_plus: number | null;
    general_group_insurance: string | null;
    general_group_insurance_features: string | null;
    wide_group_insurance: string | null;
    wide_group_insurance_conditions: string | null;
    cancer_group_insurance_100: string | null;
    cancer_group_insurance_100_notes: string | null;
    three_major_diseases_plus: string | null;
    three_major_diseases_plus_conditions: string | null;
    general_insurance_non_participation: string | null;
    general_insurance_non_participation_notes: string | null;
    features: string | null;
    created_at: string;
    updated_at?: string;
    
    // 雇用形態関連
    employment_regular_months: number | null;
    employment_regular_months_notes: string | null;
    employment_contract_months: number | null;
    employment_contract_months_notes: string | null;
    employment_dispatch_months: number | null;
    employment_dispatch_months_notes: string | null;
    
    // 属性関連
    representative: string | null;
    representative_notes: string | null;
    self_employed: string | null;
    self_employed_notes: string | null;
    maternity_paternity_leave: string | null;
    maternity_paternity_leave_notes: string | null;
    single_person: string | null;
    single_person_notes: string | null;
    family_residential_loan: string | null;
    no_permanent_residency: string | null;
    permanent_residency_notes: string | null;
    lgbtq: string | null;
    lgbtq_notes: string | null;
    pre_marriage_consolidation: string | null;
    common_law_marriage: string | null;
    pair_loan: string | null;
    pair_loan_notes: string | null;
    income_consolidation_joint_liability: string | null;
    income_consolidation_joint_liability_notes: string | null;
    income_consolidation_joint_guarantee: string | null;
    income_consolidation_joint_guarantee_notes: string | null;
    consolidation_employment_type: string | null;
    consolidation_employment_type_notes: string | null;
    
    // 物件条件関連
    ms_area_limit_sqm: number | null;
    over_25_years_old: string | null;
    old_earthquake_standards: string | null;
    old_earthquake_standards_notes: string | null;
    outside_urbanization_area: string | null;
    leasehold: string | null;
    leasehold_notes: string | null;
    non_rebuildable: string | null;
    non_rebuildable_notes: string | null;
    existing_non_conforming: string | null;
    existing_non_conforming_notes: string | null;
    self_management: string | null;
    self_management_notes: string | null;
    
    // 特殊項目関連
    various_expenses: string | null;
    various_expenses_notes: string | null;
    renovation: string | null;
    renovation_notes: string | null;
    property_exchange: string | null;
    property_exchange_notes: string | null;
    bridge_loan: string | null;
    bridge_loan_notes: string | null;
    debt_consolidation_loan: string | null;
    debt_consolidation_loan_notes: string | null;
    
    [key: string]: any;
  }