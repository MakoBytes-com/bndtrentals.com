// Hand-written types for the bndt-prod schema (supabase/migrations/0001_init.sql).
// When the schema stabilizes, replace this with generated types via:
//   supabase gen types typescript --project-id zgevzjlavbaxpirpautf > src/lib/supabase/types.gen.ts

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: "admin" | "staff";
  totp_secret: string | null;
  totp_enrolled: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type LoginAttempt = {
  id: number;
  email: string | null;
  ip: string | null;
  user_agent: string | null;
  success: boolean;
  reason: string | null;
  created_at: string;
};

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  short: string | null;
  tagline: string | null;
  description: string | null;
  hero_image: string | null;
  sort_order: number;
  parent_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  category_id: string;
  subcategory: string | null;
  name: string;
  manufacturer: string | null;
  description: string | null;
  applications: string[];
  image: string | null;
  pdf: string | null;
  specs: Record<string, unknown>;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type QuoteLeadStatus = "new" | "in_progress" | "quoted" | "won" | "lost" | "spam";

export type QuoteLead = {
  id: string;
  ordered_by: string | null;
  company: string | null;
  email: string;
  phone: string | null;
  shipping: string | null;
  date_needed: string | null;
  duration: string | null;
  erpp: string | null;
  po_or_cc: string | null;
  shipping_account: string | null;
  instructions: string | null;
  interests: string[];
  cart: Array<{
    productSlug: string;
    categorySlug: string;
    productName: string;
    productImage?: string;
    quantity: number;
    kind?: "rental" | "calibration";
  }>;
  source_url: string | null;
  user_agent: string | null;
  ip: string | null;
  turnstile_ok: boolean | null;
  status: QuoteLeadStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type CalibrationRecallStatus =
  | "pending"
  | "reminded"
  | "overdue"
  | "completed"
  | "cancelled";

export type CalibrationRecall = {
  id: string;
  customer_email: string;
  customer_name: string | null;
  customer_company: string | null;
  equipment_ref: string;
  equipment_label: string | null;
  serial_number: string | null;
  last_calibrated: string | null;
  due_date: string;
  notification_sent_at: string | null;
  notification_count: number;
  status: CalibrationRecallStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type PageSection = {
  id: string;
  slug: string;
  title: string;
  body_html: string;
  metadata: Record<string, unknown>;
  version: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

// Shape required by @supabase/supabase-js generic. Tables need
// Row/Insert/Update/Relationships; the empty Views/Functions/Enums/CompositeTypes
// blocks keep the generic happy without forcing us to enumerate them.
type TableDef<R, I, U> = {
  Row: R;
  Insert: I;
  Update: U;
  Relationships: [];
};

export type CustomerStatus = "active" | "prospect" | "inactive" | "do_not_contact";

export type Customer = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  shipping_address: string | null;
  internal_notes: string | null;
  status: CustomerStatus;
  source: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_contact_at: string | null;
};

export type PageView = {
  id: string;
  path: string;
  referrer: string | null;
  user_agent: string | null;
  session_id: string;
  ip: string | null;
  country: string | null;
  created_at: string;
};

export type AnalyticsEvent = {
  id: string;
  name: string;
  path: string;
  session_id: string;
  data: Record<string, unknown> | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      admin_users: TableDef<
        AdminUser,
        Partial<AdminUser> & Pick<AdminUser, "email" | "full_name" | "password_hash">,
        Partial<AdminUser>
      >;
      login_attempts: TableDef<
        LoginAttempt,
        Partial<LoginAttempt> & Pick<LoginAttempt, "success">,
        Partial<LoginAttempt>
      >;
      catalog_categories: TableDef<
        CatalogCategory,
        Partial<CatalogCategory> & Pick<CatalogCategory, "slug" | "name">,
        Partial<CatalogCategory>
      >;
      catalog_products: TableDef<
        CatalogProduct,
        Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "category_id" | "name">,
        Partial<CatalogProduct>
      >;
      quote_leads: TableDef<
        QuoteLead,
        Partial<QuoteLead> & Pick<QuoteLead, "email">,
        Partial<QuoteLead>
      >;
      calibration_recalls: TableDef<
        CalibrationRecall,
        Partial<CalibrationRecall> &
          Pick<CalibrationRecall, "customer_email" | "equipment_ref" | "due_date">,
        Partial<CalibrationRecall>
      >;
      page_sections: TableDef<
        PageSection,
        Partial<PageSection> & Pick<PageSection, "slug" | "title">,
        Partial<PageSection>
      >;
      customers: TableDef<
        Customer,
        Partial<Customer> & Pick<Customer, "email">,
        Partial<Customer>
      >;
      page_views: TableDef<
        PageView,
        Partial<PageView> & Pick<PageView, "path" | "session_id">,
        Partial<PageView>
      >;
      analytics_events: TableDef<
        AnalyticsEvent,
        Partial<AnalyticsEvent> & Pick<AnalyticsEvent, "name" | "path" | "session_id">,
        Partial<AnalyticsEvent>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
