import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("banks").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
// app/api/banks/route.ts
const { data, error } = await supabase
  .from("banks")
  .select("id, name, product, product_rate, min_annual_income, notes, extra");


