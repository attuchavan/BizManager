import { useState, useEffect } from "react";
import {
  Printer,
  X,
  CheckCircle,
  Clock,
  QrCode,
  Smartphone,
  MessageSquare,
  Copy,
  Check,
  Send,
} from "lucide-react";
import {
  generateUpiUri,
  generateUpiQrDataUrl,
  getEffectiveBusinessUpi,
  formatInr,
} from "../../utils/upiPayments";

export default function InvoiceViewModal({
  isOpen,
  onClose,
  invoice,
  business,
  businessName = "AI Business Manager",
}) {
  if (!isOpen || !invoice) return null;

  const isPaid = invoice.status === "Paid";
  const effectiveBusinessName =
    business?.name || business?.businessName || businessName;
  const upiId = getEffectiveBusinessUpi(business);

  const [qrUrl, setQrUrl] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    async function loadQr() {
      if (invoice && !isPaid) {
        try {
          const uri = generateUpiUri({
            upiId,
            payeeName: effectiveBusinessName,
            amount: invoice.total,
            transactionNote: `Invoice ${invoice.invoiceNumber || invoice.id}`,
            transactionRef: invoice.invoiceNumber || invoice.id,
          });
          const url = await generateUpiQrDataUrl(uri, { width: 220 });
          setQrUrl(url);
        } catch (e) {
          console.error("Invoice QR error:", e);
        }
      }
    }
    loadQr();
  }, [invoice, isPaid, upiId, effectiveBusinessName]);

  function handlePrint() {
    window.print();
  }

  function handleCopyUpi() {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  }

  // Pre-filled WhatsApp Bill dispatch link
  const whatsappText = encodeURIComponent(
    `Hello ${invoice.customerName},\n\nHere is your invoice *#${
      invoice.invoiceNumber || invoice.id
    }* from *${effectiveBusinessName}*.\n\n*Amount Due:* ₹${Number(
      invoice.total || 0
    ).toLocaleString("en-IN")}\n*Due Date:* ${
      invoice.dueDate || "Immediate"
    }\n*Payment UPI ID:* ${upiId}\n\nThank you for choosing ${effectiveBusinessName}!`
  );
  const cleanPhone = (invoice.customerPhone || "").replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${
    cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`
  }?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Controls Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isPaid
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
              }`}
            >
              {invoice.status}
            </span>
            <span className="text-xs text-slate-500 font-mono font-semibold">
              {invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.customerPhone && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 transition"
              >
                <MessageSquare size={13} className="text-emerald-600" />
                <span>WhatsApp Bill</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition active:scale-95"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0 print:overflow-visible text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-6 dark:border-slate-800 gap-4">
            <div>
              <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                {effectiveBusinessName}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Official Commercial Invoice & Payment Receipt
              </p>
            </div>

            <div className="text-left sm:text-right">
              <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {invoice.invoiceNumber}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Issue Date:{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {invoice.issueDate}
                </strong>
              </p>
              <p className="text-xs text-slate-400">
                Due Date:{" "}
                <strong className="text-slate-700 dark:text-slate-300">
                  {invoice.dueDate}
                </strong>
              </p>
            </div>
          </div>

          {/* Billed To */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Billed To
              </p>
              <h3 className="mt-1 font-bold text-slate-900 dark:text-white">
                {invoice.customerName}
              </h3>
              {invoice.customerEmail && (
                <p className="text-xs text-slate-500">{invoice.customerEmail}</p>
              )}
              {invoice.customerPhone && (
                <p className="text-xs text-slate-500 font-mono">
                  {invoice.customerPhone}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Payment Status
              </p>
              <p
                className={`mt-1 font-bold text-sm ${
                  isPaid ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {invoice.status}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      ₹{Number(item.rate || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                      ₹
                      {(
                        (Number(item.quantity) || 1) * (Number(item.rate) || 0)
                      ).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment QR & Totals Breakdown Section */}
          <div className="mt-6 flex flex-col sm:flex-row items-start justify-between gap-6">
            {/* Dynamic UPI QR Code (for pending/overdue invoices) */}
            {!isPaid ? (
              <div className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-slate-800/70">
                {qrUrl ? (
                  <div className="relative rounded-xl bg-white p-2 shadow-xs border border-slate-200 shrink-0">
                    <img
                      src={qrUrl}
                      alt="UPI QR Code"
                      className="h-28 w-28 object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="rounded bg-white px-1 text-[8px] font-black text-indigo-700 shadow-xs border border-slate-200">
                        UPI
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 w-28 bg-slate-100 animate-pulse rounded-xl shrink-0" />
                )}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    <QrCode size={14} className="text-indigo-600" />
                    <span>Scan to Pay via UPI</span>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-[190px] leading-tight">
                    Scan with Google Pay, PhonePe, Paytm, or BHIM for zero-fee instant settlement.
                  </p>
                  <div className="flex items-center gap-1 pt-1 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    <span>{upiId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-indigo-600 hover:text-indigo-700 p-0.5 print:hidden"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300">
                <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold">Payment Verified & Settled</p>
                  <p className="text-[11px] opacity-80">
                    Thank you for your business! This official receipt serves as proof of payment.
                  </p>
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="w-full sm:w-64 space-y-2 text-xs ml-auto">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹
                  {Number(
                    invoice.subtotal || invoice.total || 0
                  ).toLocaleString("en-IN")}
                </span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>GST ({invoice.taxPercent}%):</span>
                  <span>
                    ₹{Number(invoice.taxAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>
                    -₹{Number(invoice.discount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black">
                  ₹{Number(invoice.total || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Notes / Footer */}
          {invoice.notes && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Payment Instructions & Notes:
              </p>
              <p className="mt-1 leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
