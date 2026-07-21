"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSession } from "@/components/app/app-session";
import {
 cancelSubscription,
 checkoutCustomTokens,
 checkoutSubscription,
 checkoutTokenPackage,
 getCurrentSubscription,
 listInvoices,
 listPayments,
 listPlans,
 listTokenPackages,
 listTokenPurchases,
 listTokenTransactions,
 openCustomerPortal,
 reactivateSubscription,
 synchronizeSubscription,
 validateCoupon,
} from "@/lib/billing-api";
import type {
 BillingInvoice,
 BillingPayment,
 SubscriptionPlan,
 TokenPackage,
 TokenPurchase,
 TokenTransaction,
 UserSubscription,
} from "@/types/billing";

const money = (value: string | number, currency = "USD") =>
 new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: currency.toUpperCase(),
 }).format(Number(value));

const date = (value?: string | null) =>
 value
  ? new Intl.DateTimeFormat("es-MX", {
     dateStyle: "medium",
     timeStyle: "short",
    }).format(new Date(value))
  : "—";

const statusLabel = (status?: string | null) => {
 const normalizedStatus = (status || "").toLowerCase();
 const labels: Record<string, string> = {
  succeeded: "Pagado",
  paid: "Pagado",
  completed: "Completado",
  credited: "Acreditado",
  pending: "Pendiente",
  processing: "Procesando",
  failed: "Fallido",
  canceled: "Cancelado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso parcial",
  open: "Pendiente de pago",
  void: "Anulada",
  draft: "Borrador",
  active: "Activo",
 };
 return labels[normalizedStatus] || status || "Sin estado";
};

const subscriptionMovementLabel = (paymentType: string) =>
 paymentType === "subscription_renewal"
  ? "Renovación de suscripción"
  : "Compra de suscripción";

const titleFromKey = (value: string) =>
 value
  .replace(/[_-]+/g, " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const friendlyTransactionDescription = (
 transaction: TokenTransaction,
 currentPlanName?: string | null,
) => {
 const description = transaction.description?.trim();
 if (!description) {
  return transaction.source || transaction.transaction_type;
 }

 const subscriptionMatch = description.match(
  /Subscription tokens for plan\s+([^;]+)(?:;\s*invoice\s+\S+)?/i,
 );
 if (subscriptionMatch) {
  const planName = currentPlanName || titleFromKey(subscriptionMatch[1]);
  return `Tokens incluidos en el plan ${planName}`;
 }

 return description
  .replace(/;\s*invoice\s+in_[A-Za-z0-9]+/gi, "")
  .replace(/\bin_[A-Za-z0-9]+\b/g, "")
  .trim();
};

const paymentMethodLabel = (detail?: BillingPayment | null) => {
 if (!detail) return null;

 const brands: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
 };
 const wallets: Record<string, string> = {
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  link: "Link",
 };
 const brand = detail.payment_method_brand
  ? brands[detail.payment_method_brand] ||
    titleFromKey(detail.payment_method_brand)
  : null;
 const card =
  brand && detail.payment_method_last4
   ? `${brand} •••• ${detail.payment_method_last4}`
   : brand;
 const wallet = detail.payment_method_wallet
  ? wallets[detail.wallet_type] || titleFromKey(detail.wallet_type)
  : null;

 if (wallet && card) return `${wallet} · ${card}`;
 if (card) return card;
 if (detail.payment_method_type) {
  return titleFromKey(detail.payment_method_type);
 }
 return null;
};

export function BillingCenter() {
 const params = useSearchParams();
 const { user, refreshUser } = useAppSession();
 const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
 const [packages, setPackages] = useState<TokenPackage[]>([]);
 const [subscription, setSubscription] = useState<UserSubscription | null>(null);
 const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
 const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
 const [payments, setPayments] = useState<BillingPayment[]>([]);
 const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
 const [loading, setLoading] = useState(true);
 const [busy, setBusy] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [notice, setNotice] = useState<string | null>(null);
 const [couponCode, setCouponCode] = useState("");
 const [couponMessage, setCouponMessage] = useState<string | null>(null);
 const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
 const [customTokens, setCustomTokens] = useState(1);

 const load = useCallback(async () => {
  setError(null);
  const [
   planData,
   packageData,
   transactionData,
   purchaseData,
   paymentData,
   invoiceData,
  ] = await Promise.all([
   listPlans(),
   listTokenPackages(),
   listTokenTransactions(),
   listTokenPurchases(),
   listPayments(),
   listInvoices(),
  ]);

  setPlans(planData.filter((item) => item.is_active));
  setPackages(packageData.filter((item) => item.is_active));
  setTransactions(transactionData);
  setPurchases(purchaseData.items);
  setPayments(paymentData.items);
  setInvoices(invoiceData.items);

  try {
   setSubscription(await getCurrentSubscription());
  } catch {
   setSubscription(null);
  }

  await refreshUser();
 }, [refreshUser]);

 useEffect(() => {
  load()
   .catch((value) =>
    setError(
     value instanceof Error
      ? value.message
      : "No fue posible cargar tu información comercial.",
    ),
   )
   .finally(() => setLoading(false));
 }, [load]);

 useEffect(() => {
  const checkout = params.get("checkout");

  if (checkout === "success") {
   setNotice(
    "Pago confirmado por Stripe. Estamos sincronizando tu saldo e historial.",
   );
   let attempts = 0;
   const timer = window.setInterval(() => {
    attempts += 1;
    void load();
    if (attempts >= 5) window.clearInterval(timer);
   }, 2500);
   return () => window.clearInterval(timer);
  }

  if (checkout === "cancelled") {
   setNotice(
    "El proceso de pago fue cancelado. No se realizó ningún cargo.",
   );
  }
 }, [params, load]);

 const currentPlan = useMemo(
  () =>
   plans.find(
    (plan) => plan.id === subscription?.subscription_plan_id,
   ),
  [plans, subscription],
 );

 const commercialTokenValue = useMemo(() => {
  const packageValue = packages.find(
   (item) => Number(item.commercial_token_value) > 0,
  )?.commercial_token_value;
  const planValue = plans.find(
   (item) => Number(item.commercial_token_value) > 0,
  )?.commercial_token_value;
  return Number(packageValue ?? planValue ?? 0);
 }, [packages, plans]);

 const customCurrency =
  packages[0]?.currency || plans[0]?.currency || "USD";
 const customTotal = customTokens * commercialTokenValue;

 const subscriptionPayments = useMemo(
  () =>
   payments.filter(
    (item) =>
     item.payment_type === "subscription" ||
     item.payment_type === "subscription_renewal",
   ),
  [payments],
 );

 const purchasesByPayment = useMemo(
  () =>
   new Map(
    purchases
     .filter((item) => item.billing_payment_id != null)
     .map((item) => [item.billing_payment_id as number, item]),
   ),
  [purchases],
 );

 const visibleInvoices = useMemo(
  () => invoices.filter((invoice) => invoice.invoice_documents_enabled),
  [invoices],
 );

 const paymentsById = useMemo(
  () => new Map(payments.map((payment) => [payment.id, payment])),
  [payments],
 );

 async function redirect(
  action: () => Promise<{
   checkout_url?: string;
   portal_url?: string;
  }>,
  key: string,
 ) {
  setBusy(key);
  setError(null);

  try {
   const result = await action();
   const target = result.checkout_url || result.portal_url;
   if (!target) {
    throw new Error(
     "El backend no devolvió una URL de Stripe.",
    );
   }
   window.location.assign(target);
  } catch (value) {
   setError(
    value instanceof Error
     ? value.message
     : "No fue posible abrir Stripe.",
   );
   setBusy(null);
  }
 }

 async function subscriptionAction(
  action: () => Promise<{ message: string }>,
  key: string,
 ) {
  setBusy(key);
  setError(null);

  try {
   const result = await action();
   setNotice(result.message);
   await load();
  } catch (value) {
   setError(
    value instanceof Error
     ? value.message
     : "No fue posible actualizar la suscripción.",
   );
  } finally {
   setBusy(null);
  }
 }

 function normalizeCustomTokens(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
 }

 async function buyCustomTokens() {
  const amount = normalizeCustomTokens(customTokens);
  setCustomTokens(amount);
  await redirect(
   () => checkoutCustomTokens(amount),
   "custom-tokens",
  );
 }

 async function checkCoupon() {
  if (!selectedPackage || !couponCode.trim()) return;

  setBusy("coupon");
  setCouponMessage(null);

  try {
   const result = await validateCoupon(
    couponCode.trim(),
    selectedPackage.calculated_price_cents / 100,
    "token_package",
    selectedPackage.id,
   );
   setCouponMessage(result.message);
  } catch (value) {
   setCouponMessage(
    value instanceof Error
     ? value.message
     : "No fue posible validar el cupón.",
   );
  } finally {
   setBusy(null);
  }
 }

 if (loading) {
  return (
   <div className="historyState">
    <span className="spinner" />
    <p>Cargando economía de tu cuenta…</p>
   </div>
  );
 }

 return (
  <div className="billingCenter">
   {(notice || error) && (
    <div
     className={
      error ? "billingAlert billingAlertError" : "billingAlert"
     }
    >
     {error || notice}
    </div>
   )}

   <section className="billingHero">
    <div>
     <span className="eyebrow">SALDO ACTUAL</span>
     <strong>{user.token_balance ?? 0}</strong>
     <p>tokens disponibles para generar nuevos Try-On.</p>
    </div>

    <div className="subscriptionSummary">
     <small>PLAN ACTUAL</small>
     <h2>
      {currentPlan?.name ||
       (subscription
        ? "Suscripción activa"
        : "Sin plan activo")}
     </h2>
     <p>
      {subscription
       ? `Estado: ${statusLabel(subscription.status)}`
       : "Puedes comprar tokens sin suscripción o elegir un plan."}
     </p>
     {subscription?.current_period_end && (
      <span>
       Renovación: {date(subscription.current_period_end)}
      </span>
     )}

     <div className="billingActions">
      {subscription && (
       <button
        onClick={() =>
         redirect(openCustomerPortal, "portal")
        }
        disabled={!!busy}
       >
        {busy === "portal"
         ? "Abriendo…"
         : "Administrar en Stripe"}
       </button>
      )}
      {subscription?.cancel_at_period_end ? (
       <button
        onClick={() =>
         subscriptionAction(
          reactivateSubscription,
          "reactivate",
         )
        }
        disabled={!!busy}
       >
        Reactivar
       </button>
      ) : (
       subscription && (
        <button
         onClick={() =>
          subscriptionAction(
           cancelSubscription,
           "cancel",
          )
         }
         disabled={!!busy}
        >
         Cancelar al final
        </button>
       )
      )}
      {subscription && (
       <button
        onClick={() =>
         subscriptionAction(
          synchronizeSubscription,
          "sync",
         )
        }
        disabled={!!busy}
       >
        Sincronizar
       </button>
      )}
     </div>
    </div>
   </section>

   <section className="commercialSection">
    <div className="commercialHeading">
     <div>
      <span className="eyebrow">SUSCRIPCIONES</span>
      <h2>Planes disponibles</h2>
     </div>
     <p>
      Precios y beneficios cargados directamente desde el
      backend.
     </p>
    </div>

    <div className="planGrid">
     {plans.map((plan) => (
      <article className="commercialCard" key={plan.id}>
       <div>
        <span>
         {plan.billing_interval === "year"
          ? "ANUAL"
          : "MENSUAL"}
        </span>
        {currentPlan?.id === plan.id && <b>ACTUAL</b>}
       </div>
       <h3>{plan.name}</h3>
       <p>{plan.description}</p>
       <strong>
        {money(
         plan.calculated_price_amount,
         plan.currency,
        )}
        <small>
         /
         {plan.billing_interval === "year"
          ? "año"
          : "mes"}
        </small>
       </strong>
       <ul>
        {plan.features.map((feature) => (
         <li key={feature}>✓ {feature}</li>
        ))}
       </ul>
       <div className="commercialMeta">
        <span>
         {plan.tokens_per_period.toLocaleString(
          "es-MX",
         )}{" "}
         tokens
        </span>
        {plan.max_generations_per_period && (
         <span>
          {plan.max_generations_per_period} generaciones
         </span>
        )}
       </div>
       <button
        className="primaryButton"
        disabled={
         !!busy ||
         currentPlan?.id === plan.id ||
         !plan.stripe_configured
        }
        onClick={() =>
         redirect(
          () => checkoutSubscription(plan.key),
          `plan-${plan.id}`,
         )
        }
       >
        {currentPlan?.id === plan.id
         ? "Plan actual"
         : busy === `plan-${plan.id}`
           ? "Abriendo Stripe…"
           : plan.stripe_configured
             ? "Elegir plan"
             : "Stripe no configurado"}
       </button>
      </article>
     ))}
    </div>
   </section>

   <section className="commercialSection">
    <div className="commercialHeading">
     <div>
      <span className="eyebrow">
       TOKENS A TU MANERA
      </span>
      <h2>Compra exactamente los que necesites</h2>
     </div>
     <p>
      Desde 1 token, sin cambiar tu plan actual. El backend
      confirmará siempre el precio final.
     </p>
    </div>

    <article className="customTokenCard">
     <div>
      <small>CANTIDAD PERSONALIZADA</small>
      <h3>Elige cualquier cantidad</h3>
      <p>
       Compra 1, 37, 250 o los tokens que necesites.
      </p>
     </div>

     <div className="customTokenControls">
      <label htmlFor="customTokens">Tokens</label>
      <input
       id="customTokens"
       type="number"
       min="1"
       step="1"
       value={customTokens}
       onChange={(event) =>
        setCustomTokens(
         normalizeCustomTokens(
          Number(event.target.value),
         ),
        )
       }
      />
      <div className="customTokenQuick">
       {[1, 10, 25, 50, 100, 250, 500].map(
        (amount) => (
         <button
          type="button"
          key={amount}
          onClick={() => setCustomTokens(amount)}
         >
          {amount}
         </button>
        ),
       )}
      </div>
     </div>

     <div className="customTokenSummary">
      <small>PRECIO ESTIMADO</small>
      <strong>
       {commercialTokenValue > 0
        ? money(customTotal, customCurrency)
        : "Calculado en Stripe"}
      </strong>
      <span>
       {commercialTokenValue > 0
        ? `${money(
           commercialTokenValue,
           customCurrency,
          )} por token`
        : "El backend aplicará el valor comercial vigente."}
      </span>
      <button
       className="primaryButton"
       disabled={!!busy || customTokens < 1}
       onClick={() => void buyCustomTokens()}
      >
       {busy === "custom-tokens"
        ? "Abriendo Stripe…"
        : `Comprar ${customTokens.toLocaleString(
           "es-MX",
          )} token${customTokens === 1 ? "" : "s"}`}
      </button>
     </div>
    </article>

    <div className="commercialHeading packageHeading">
     <div>
      <span className="eyebrow">PAQUETES</span>
      <h2>Opciones preparadas</h2>
     </div>
     <p>
      También puedes elegir uno de los paquetes configurados
      desde el BackOffice.
     </p>
    </div>

    <div className="packageGrid">
     {packages.map((item) => (
      <article
       className={`packageCard ${
        selectedPackage?.id === item.id
         ? "selected"
         : ""
       }`}
       key={item.id}
       onClick={() => setSelectedPackage(item)}
      >
       <small>{item.name}</small>
       <strong>
        {item.tokens_amount.toLocaleString("es-MX")}
       </strong>
       <span>tokens</span>
       <b>
        {money(
         item.calculated_price_cents / 100,
         item.currency,
        )}
       </b>
       <p>{item.description}</p>
       <button
        className="primaryButton"
        disabled={!!busy || !item.stripe_price_id}
        onClick={(event) => {
         event.stopPropagation();
         void redirect(
          () => checkoutTokenPackage(item.id),
          `package-${item.id}`,
         );
        }}
       >
        {busy === `package-${item.id}`
         ? "Abriendo Stripe…"
         : item.stripe_price_id
           ? "Comprar"
           : "Stripe no configurado"}
       </button>
      </article>
     ))}
    </div>

    {selectedPackage && (
     <div className="couponBox">
      <div>
       <strong>
        Validar cupón para {selectedPackage.name}
       </strong>
       <p>
        Stripe permitirá aplicar códigos promocionales
        durante el checkout. Aquí puedes comprobar su
        elegibilidad antes de continuar.
       </p>
      </div>
      <div>
       <input
        value={couponCode}
        onChange={(event) =>
         setCouponCode(
          event.target.value.toUpperCase(),
         )
        }
        placeholder="CÓDIGO"
       />
       <button
        onClick={checkCoupon}
        disabled={
         busy === "coupon" || !couponCode.trim()
        }
       >
        {busy === "coupon"
         ? "Validando…"
         : "Validar"}
       </button>
      </div>
      {couponMessage && <span>{couponMessage}</span>}
     </div>
    )}
   </section>

   <section className="commercialSection billingCommerceSection">
    <div className="commercialHeading">
     <div>
      <span className="eyebrow">PAGOS Y COMPRAS</span>
      <h2>Actividad comercial</h2>
     </div>
     <button
      className="ghostButton"
      onClick={() => void load()}
      disabled={!!busy}
     >
      Actualizar
     </button>
    </div>

    <div className="billingCommerceGrid">
     <div className="billingTable billingCommerceCard">
      <div className="billingBlockHeading">
       <span className="billingBlockIcon" aria-hidden="true">S</span>
       <div>
        <h3>Pagos de suscripción</h3>
        <p>Altas, renovaciones y cambios de plan.</p>
       </div>
      </div>
      {subscriptionPayments.length ? (
       subscriptionPayments.map((item) => (
        <div key={item.id}>
         <span>
          <b>{currentPlan?.name || "Plan de suscripción"}</b>
          <small>
           {subscriptionMovementLabel(item.payment_type)} · {statusLabel(item.status)}
          </small>
          {paymentMethodLabel(item) && <small>{paymentMethodLabel(item)}</small>}
          <small>{date(item.paid_at || item.created_at)}</small>
         </span>
         <strong>{money(item.amount, item.currency)}</strong>
        </div>
       ))
      ) : (
       <p className="billingEmptyState">Sin pagos de suscripción.</p>
      )}
     </div>

     <div className="billingTable billingCommerceCard">
      <div className="billingBlockHeading">
       <span className="billingBlockIcon" aria-hidden="true">T</span>
       <div>
        <h3>Compras de tokens</h3>
        <p>Paquetes y compras personalizadas.</p>
       </div>
      </div>
      {purchases.length ? (
       purchases.map((item) => {
        const tokenPackage = packages.find(
         (packageItem) => packageItem.id === item.token_package_id,
        );
        const purchaseTitle =
         tokenPackage?.name ||
         (item.token_package_id === null
          ? "Compra personalizada"
          : "Paquete de tokens");

        return (
         <div key={item.id}>
          <span>
           <b>{purchaseTitle}</b>
           <small>
            {item.total_tokens.toLocaleString("es-MX")} tokens · {statusLabel(item.status)}
           </small>
           {paymentMethodLabel(
            item.billing_payment_id
             ? paymentsById.get(item.billing_payment_id)
             : undefined,
           ) && (
            <small>
             {paymentMethodLabel(
              item.billing_payment_id
               ? paymentsById.get(item.billing_payment_id)
               : undefined,
             )}
            </small>
           )}
           <small>{date(item.paid_at || item.created_at)}</small>
          </span>
          <strong>{money(item.amount, item.currency)}</strong>
         </div>
        );
       })
      ) : (
       <p className="billingEmptyState">Sin compras de tokens.</p>
      )}
     </div>
    </div>
   </section>

   <section className="commercialSection billingLedgerSection">
    <div className="commercialHeading">
     <div>
      <span className="eyebrow">CONTABILIDAD DE TOKENS</span>
      <h2>Movimientos de tokens</h2>
     </div>
     <p>Entradas, consumos, bonificaciones y ajustes de saldo.</p>
    </div>

    <div className="billingTable billingFullWidthTable">
     <div className="billingTableHeader" aria-hidden="true">
      <span>Movimiento</span>
      <span>Fecha</span>
      <span>Tokens</span>
     </div>
     {transactions.length ? (
      transactions.map((item) => (
       <div className="billingLedgerRow" key={item.id}>
        <span>
         <b>{friendlyTransactionDescription(item, currentPlan?.name)}</b>
         <small>{item.source || item.transaction_type}</small>
        </span>
        <small className="billingRowDate">{date(item.created_at)}</small>
        <strong className={item.amount >= 0 ? "positive" : "negative"}>
         {item.amount >= 0 ? "+" : ""}
         {item.amount.toLocaleString("es-MX")}
        </strong>
       </div>
      ))
     ) : (
      <p className="billingEmptyState">Sin movimientos de tokens.</p>
     )}
    </div>
   </section>

   <section className="commercialSection billingInvoicesSection">
    <div className="commercialHeading">
     <div>
      <span className="eyebrow">DOCUMENTOS DE PAGO</span>
      <h2>Facturas</h2>
     </div>
     <p>Facturas de suscripciones y compras reunidas en un solo lugar.</p>
    </div>

    <div className="billingTable billingFullWidthTable billingInvoiceTable">
     <div className="billingTableHeader billingInvoiceHeader" aria-hidden="true">
      <span>Factura</span>
      <span>Tipo</span>
      <span>Fecha</span>
      <span>Total y acciones</span>
     </div>
     {visibleInvoices.length ? (
      visibleInvoices.map((item) => {
       const relatedPurchase = item.billing_payment_id
        ? purchasesByPayment.get(item.billing_payment_id)
        : undefined;
       const relatedPackage = relatedPurchase?.token_package_id
        ? packages.find(
           (packageItem) => packageItem.id === relatedPurchase.token_package_id,
          )
        : undefined;
       const invoiceType = relatedPurchase ? "Compra de tokens" : "Suscripción";
       const invoiceTitle = relatedPurchase
        ? relatedPackage?.name
         ? `Factura de ${relatedPackage.name}`
         : "Factura de compra personalizada"
        : currentPlan?.name
         ? `Factura de ${currentPlan.name}`
         : "Factura de suscripción";

       return (
        <div className="billingInvoiceRow" key={item.id}>
         <span>
          <b>{invoiceTitle}</b>
          <small>
           {item.invoice_number ? `N.º ${item.invoice_number} · ` : ""}
           {statusLabel(item.status)}
          </small>
         </span>
         <span className="billingInvoiceType">{invoiceType}</span>
         <small className="billingRowDate">{date(item.created_at)}</small>
         <span className="invoiceActions">
          <strong>{money(item.total, item.currency)}</strong>
          {item.hosted_invoice_url && (
           <a href={item.hosted_invoice_url} target="_blank" rel="noreferrer">
            Ver factura
           </a>
          )}
          {item.invoice_pdf_url && (
           <a href={item.invoice_pdf_url} target="_blank" rel="noreferrer">
            Descargar PDF
           </a>
          )}
         </span>
        </div>
       );
      })
     ) : (
      <p className="billingEmptyState">
       {invoices.length
        ? "Las facturas existentes no están habilitadas para publicación."
        : "Sin facturas disponibles."}
      </p>
     )}
    </div>
   </section>
  </div>
 );
}
