export type SubscriptionPlan = {
 id: number;
 key: string;
 name: string;
 description?: string | null;
 billing_interval: "month" | "year" | string;
 currency: string;
 price_amount: string | number;
 calculated_price_amount: string | number;
 commercial_token_value: string | number;
 price_is_automatic: boolean;
 tokens_per_period: number;
 max_generations_per_period?: number | null;
 features: string[];
 stripe_configured: boolean;
 is_active: boolean;
};

export type TokenPackage = {
 id: number;
 name: string;
 description?: string | null;
 tokens_amount: number;
 price_cents: number;
 calculated_price_cents: number;
 commercial_token_value: number;
 price_is_automatic: boolean;
 currency: string;
 stripe_price_id?: string | null;
 is_active: boolean;
};

export type TokenTransaction = {
 id: number;
 transaction_type: string;
 amount: number;
 balance_after: number;
 source?: string | null;
 reference_id?: string | null;
 description?: string | null;
 created_at: string;
};

export type UserSubscription = {
 id: number;
 status: string;
 subscription_plan_id: number;
 provider_subscription_id?: string | null;
 current_period_start?: string | null;
 current_period_end?: string | null;
 cancel_at_period_end?: boolean;
 canceled_at?: string | null;
};

export type TokenPurchase = {
 id: number;
 token_package_id: number | null;
 billing_payment_id?: number | null;
 status: string;
 tokens_amount: number;
 bonus_tokens: number;
 total_tokens: number;
 currency: string;
 amount: string | number;
 paid_at?: string | null;
 credited_at?: string | null;
 created_at: string;
};

export type TokenPurchaseList = {
 items: TokenPurchase[];
 total: number;
 skip: number;
 limit: number;
};

export type BillingPayment = {
 id: number;
 payment_type: string;
 status: string;
 currency: string;
 amount: string | number;
 refunded_amount: string | number;
 description?: string | null;
 payment_method_type?: string | null;
 payment_method_brand?: string | null;
 payment_method_last4?: string | null;
 payment_method_wallet?: string | null;
 paid_at?: string | null;
 created_at: string;
};

export type BillingPaymentList = {
 items: BillingPayment[];
 total: number;
 skip: number;
 limit: number;
};

export type BillingInvoice = {
 id: number;
 user_subscription_id?: number | null;
 billing_payment_id?: number | null;
 invoice_number?: string | null;
 status: string;
 currency: string;
 total: string | number;
 amount_paid: string | number;
 hosted_invoice_url?: string | null;
 invoice_pdf_url?: string | null;
 invoice_documents_enabled: boolean;
 created_at: string;
};

export type BillingInvoiceList = {
 items: BillingInvoice[];
 total: number;
 skip: number;
 limit: number;
};

export type CouponValidation = {
 valid: boolean;
 message: string;
 coupon?: {
  id: number;
  code: string;
  name: string;
  discount_type: string;
  percentage_off?: string | number | null;
  amount_off?: string | number | null;
  currency?: string | null;
 } | null;
};
