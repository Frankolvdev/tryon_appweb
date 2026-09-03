import { apiFetch } from "@/lib/api";
import type { LegalAcceptanceBundle } from "@/types/legal";
import type {
 BillingInvoiceList,
 BillingPaymentList,
 CouponValidation,
 SubscriptionPlan,
 TokenPackage,
 TokenPurchaseList,
 TokenTransaction,
 UserSubscription,
} from "@/types/billing";

const currentUrl = (path: string) => `${window.location.origin}${path}`;

export const listPlans = () =>
 apiFetch<SubscriptionPlan[]>("/api/v1/subscription-plans");
export const listTokenPackages = () =>
 apiFetch<TokenPackage[]>("/api/v1/tokens/packages");
export const listTokenTransactions = () =>
 apiFetch<TokenTransaction[]>("/api/v1/tokens/transactions?limit=25");
export const listTokenPurchases = () =>
 apiFetch<TokenPurchaseList>("/api/v1/billing/token-purchases?limit=25");
export const listPayments = () =>
 apiFetch<BillingPaymentList>("/api/v1/billing/history/payments?limit=25");
export const listInvoices = () =>
 apiFetch<BillingInvoiceList>("/api/v1/billing/history/invoices?limit=25");
export const getCurrentSubscription = () =>
 apiFetch<UserSubscription>("/api/v1/billing/subscriptions/current");

export async function checkoutTokenPackage(tokenPackageId: number, couponCode: string | undefined, legal: LegalAcceptanceBundle) {
 return apiFetch<{ checkout_url: string }>("/api/v1/billing/checkout/tokens", {
  method: "POST",
  body: JSON.stringify({
   token_package_id: tokenPackageId,
   success_url: currentUrl("/billing?checkout=success&type=tokens"),
   cancel_url: currentUrl("/billing?checkout=cancelled&type=tokens"),
   allow_promotion_codes: false,
   coupon_code: couponCode?.trim() || undefined,
   legal,
  }),
 });
}

export async function checkoutCustomTokens(tokensAmount: number, couponCode: string | undefined, legal: LegalAcceptanceBundle) {
 return apiFetch<{ checkout_url: string }>("/api/v1/billing/checkout/tokens", {
  method: "POST",
  body: JSON.stringify({
   tokens_amount: tokensAmount,
   success_url: currentUrl("/billing?checkout=success&type=custom-tokens"),
   cancel_url: currentUrl("/billing?checkout=cancelled&type=custom-tokens"),
   allow_promotion_codes: false,
   coupon_code: couponCode?.trim() || undefined,
   legal,
  }),
 });
}

export async function checkoutSubscription(planKey: string, legal: LegalAcceptanceBundle) {
 return apiFetch<{ checkout_url: string }>(
  "/api/v1/billing/subscriptions/checkout",
  {
   method: "POST",
   body: JSON.stringify({
    plan_key: planKey,
    success_url: currentUrl("/billing?checkout=success&type=subscription"),
    cancel_url: currentUrl("/billing?checkout=cancelled&type=subscription"),
    allow_promotion_codes: false,
    legal,
   }),
  },
 );
}

export const openCustomerPortal = () =>
 apiFetch<{ portal_url: string }>("/api/v1/billing/customer-portal", {
  method: "POST",
  body: JSON.stringify({ return_url: currentUrl("/billing") }),
 });

export const cancelSubscription = () =>
 apiFetch<{ message: string }>("/api/v1/billing/subscriptions/cancel", {
  method: "POST",
  body: JSON.stringify({ cancel_immediately: false }),
 });

export const reactivateSubscription = () =>
 apiFetch<{ message: string }>("/api/v1/billing/subscriptions/reactivate", {
  method: "POST",
  body: JSON.stringify({ confirm: true }),
 });

export const synchronizeSubscription = () =>
 apiFetch<{ message: string }>("/api/v1/billing/subscriptions/sync", {
  method: "POST",
 });

export const validateCoupon = (
 code: string,
 purchaseAmount: number,
 purchaseType: "token_package" | "free_token_purchase",
 itemId?: number,
 tokensAmount?: number,
) =>
 apiFetch<CouponValidation>("/api/v1/billing-coupons/validate", {
  method: "POST",
  body: JSON.stringify({
   code,
   purchase_amount: purchaseAmount,
   purchase_type: purchaseType,
   item_id: itemId,
   tokens_amount: tokensAmount,
  }),
 });
