import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const banks = sqliteTable("banks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  maxLoanSingle: integer("max_loan_single").notNull(),
  maxLoanPair: integer("max_loan_pair").notNull(),
  minEmploymentYears: integer("min_employment_years").notNull(),
  requirePermanent: integer("require_permanent", { mode: "boolean" }).notNull().default(false),
  minAnnualIncome: integer("min_annual_income").notNull(),
  dtiLimitBelow400: integer("dti_limit_below400").notNull(),
  dtiLimitAbove400: integer("dti_limit_above400").notNull(),
  screeningRate: real("screening_rate").notNull(), // %
  productRate: real("product_rate").notNull(),     // %
  maxAgeAtMaturity: integer("max_age_at_maturity").notNull(),
  minAge: integer("min_age").notNull(),
  maxTenor: integer("max_tenor").notNull(),
  ltvLimit: integer("ltv_limit").notNull(),
  supportsPair: integer("supports_pair", { mode: "boolean" }).notNull().default(true),
  supportsVariable: integer("supports_variable", { mode: "boolean" }).notNull().default(true),
  supportsFixed: integer("supports_fixed", { mode: "boolean" }).notNull().default(true),
  insurance: text("insurance").notNull().default('{"normal":true,"wide":false,"cancer":false}'),
  notes: text("notes"),
  effectiveFrom: text("effective_from").default(sql`CURRENT_DATE`),
  effectiveTo: text("effective_to"),
});
