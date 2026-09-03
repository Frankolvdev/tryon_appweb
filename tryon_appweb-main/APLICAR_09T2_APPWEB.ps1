$ErrorActionPreference = 'Stop'

$target = Join-Path $PSScriptRoot 'src/components/billing/billing-center.tsx'
$cssTarget = Join-Path $PSScriptRoot 'src/app/globals.css'

if (-not (Test-Path $target)) { throw "No se encontró $target. Descomprime este ZIP en la raíz de tryon_appweb." }
if (-not (Test-Path $cssTarget)) { throw "No se encontró $cssTarget. Descomprime este ZIP en la raíz de tryon_appweb." }

$content = Get-Content -Raw -Encoding UTF8 $target
$startMarker = '  <section className="commercialSection"><div className="commercialHeading"><div><span className="eyebrow">COMPRAS Y PAGOS</span><h2>Actividad de tokens</h2></div><button className="ghostButton" onClick={() => void load()} disabled={!!busy}>Actualizar</button></div>'
$endMarker = '  </section>'
$start = $content.IndexOf($startMarker)
if ($start -lt 0) { throw 'No se encontró el bloque comercial esperado. El repositorio local no coincide con la versión pública revisada.' }
$secondSectionStart = $content.IndexOf('  <section className="commercialSection"><div className="commercialHeading"><div><span className="eyebrow">SUSCRIPCIONES</span><h2>Pagos y facturas del plan</h2>', $start)
if ($secondSectionStart -lt 0) { throw 'No se encontró el bloque de suscripciones esperado.' }
$end = $content.IndexOf($endMarker, $secondSectionStart)
if ($end -lt 0) { throw 'No se encontró el cierre del bloque de suscripciones.' }
$end += $endMarker.Length

$replacement = @'
  <section className="commercialSection billingActivitySection">
    <div className="commercialHeading">
      <div><span className="eyebrow">PAGOS Y COMPRAS</span><h2>Actividad comercial</h2></div>
      <button className="ghostButton" onClick={() => void load()} disabled={!!busy}>Actualizar</button>
    </div>
    <div className="billingCommerceGrid">
      <div className="billingTable billingCommerceCard">
        <h3>Pagos de suscripción</h3>
        {subscriptionPayments.length ? subscriptionPayments.map((item) => <div key={item.id}><span><b>{item.description || (item.payment_type === "subscription_renewal" ? "Renovación de plan" : "Suscripción")}</b><small>{date(item.created_at)} · {item.status}</small></span><strong>{money(item.amount, item.currency)}</strong></div>) : <p>Sin pagos de suscripción.</p>}
      </div>
      <div className="billingTable billingCommerceCard">
        <h3>Compras de tokens</h3>
        {purchases.length ? purchases.map((item) => <div key={item.id}><span><b>{item.total_tokens} tokens {item.token_package_id === null ? "personalizados" : "en paquete"}</b><small>{date(item.created_at)} · {item.status}</small></span><strong>{money(item.amount, item.currency)}</strong></div>) : <p>Sin compras de tokens.</p>}
      </div>
    </div>
  </section>

  <section className="commercialSection billingLedgerSection">
    <div className="commercialHeading"><div><span className="eyebrow">TOKENS</span><h2>Movimientos de tokens</h2></div><p>Entradas, consumos, bonificaciones y ajustes de tu saldo.</p></div>
    <div className="billingTable billingLedgerTable">
      {transactions.length ? transactions.map((item) => <div key={item.id}><span><b>{item.description || item.source || item.transaction_type}</b><small>{date(item.created_at)} · {item.source || item.transaction_type}</small></span><strong className={item.amount >= 0 ? "positive" : "negative"}>{item.amount >= 0 ? "+" : ""}{item.amount}</strong></div>) : <p>Sin movimientos.</p>}
    </div>
  </section>

  <section className="commercialSection billingPaymentsSection">
    <div className="commercialHeading"><div><span className="eyebrow">COBROS</span><h2>Pagos de compras de tokens</h2></div><p>Confirmaciones monetarias asociadas a paquetes y compras personalizadas.</p></div>
    <div className="billingTable billingLedgerTable">
      {tokenPayments.length ? tokenPayments.map((item) => <div key={item.id}><span><b>{item.description || "Compra de tokens"}</b><small>{date(item.created_at)} · {item.status}</small></span><strong>{money(item.amount, item.currency)}</strong></div>) : <p>Sin pagos de tokens.</p>}
    </div>
  </section>

  <section className="commercialSection billingInvoicesSection">
    <div className="commercialHeading"><div><span className="eyebrow">DOCUMENTOS FISCALES</span><h2>Facturas</h2></div><p>Facturas de suscripciones y compras reunidas en una sola sección.</p></div>
    <div className="billingTable billingInvoiceTable">
      {invoices.length ? invoices.map((item) => <div key={item.id}><span><b>{item.invoice_number || `Factura #${item.id}`}</b><small>{date(item.created_at)} · {item.status}</small></span><span className="invoiceActions"><strong>{money(item.total, item.currency)}</strong>{item.hosted_invoice_url && <a href={item.hosted_invoice_url} target="_blank" rel="noreferrer">Ver</a>}{item.invoice_pdf_url && <a href={item.invoice_pdf_url} target="_blank" rel="noreferrer">PDF</a>}</span></div>) : <p>Sin facturas.</p>}
    </div>
  </section>
'@

$content = $content.Substring(0, $start) + $replacement + $content.Substring($end)
Set-Content -Path $target -Value $content -Encoding UTF8

$cssMarker = '/* 09T2 billing structure */'
$css = Get-Content -Raw -Encoding UTF8 $cssTarget
if (-not $css.Contains($cssMarker)) {
  $css += @'

/* 09T2 billing structure */
.billingCommerceGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}
.billingCommerceCard,
.billingLedgerTable,
.billingInvoiceTable {
  width: 100%;
  min-width: 0;
}
.billingLedgerTable > div,
.billingInvoiceTable > div,
.billingCommerceCard > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
}
.billingLedgerSection,
.billingPaymentsSection,
.billingInvoicesSection {
  position: relative;
  overflow: hidden;
}
.billingLedgerSection::before,
.billingInvoicesSection::before {
  content: "";
  position: absolute;
  inset: 0 auto auto 0;
  width: 42%;
  height: 1px;
  background: linear-gradient(90deg, rgba(225,29,53,.85), transparent);
}
.billingInvoiceTable .invoiceActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .billingCommerceGrid { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .billingLedgerTable > div,
  .billingInvoiceTable > div,
  .billingCommerceCard > div {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .billingInvoiceTable .invoiceActions { justify-content: flex-start; flex-wrap: wrap; }
}
'@
  Set-Content -Path $cssTarget -Value $css -Encoding UTF8
}

Write-Host '09T2 aplicado correctamente.' -ForegroundColor Green
Write-Host 'Ejecuta: Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run build' -ForegroundColor Cyan
