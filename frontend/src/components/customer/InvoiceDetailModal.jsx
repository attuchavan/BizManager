import { useState, useEffect } from "react";
import {
  X,
  Printer,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  Download,
  QrCode,
} from "lucide-react";
import {
  generateUpiUri,
  generateUpiQrDataUrl,
  getEffectiveBusinessUpi,
  formatInr,
} from "../../utils/upiPayments";

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  business,
  customer,
  onOpenPayment,
}) {
  if (!isOpen || !invoice) return null;

  const businessName = business?.name || business?.businessName || "BizManager Service";
  const businessAddress = business?.address || "Registered Address";
  const businessGstin = business?.gstin || "27ABCDE1234F1Z5";
  const businessPhone = business?.phone || "+91 98765 43210";
  const businessEmail = business?.email || "billing@bizmanager.com";
  const upiId = getEffectiveBusinessUpi(business);

  const customerName = invoice.customerName || customer?.name || "Client";
  const customerEmail = invoice.customerEmail || customer?.email || "";
  const customerPhone = invoice.customerPhone || customer?.phone || "";

  const isPaid = invoice.status === "Paid";
  const isOverdue = invoice.status === "Overdue";

  const total = Number(invoice.total || invoice.amount || 0);
  const paid = Number(invoice.paid || (isPaid ? total : 0));
  const balance = invoice.balance !== undefined ? Number(invoice.balance) : Math.max(0, total - paid);

  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    async function loadQr() {
      if (!isPaid && balance > 0) {
        try {
          const uri = generateUpiUri({
            upiId,
            payeeName: businessName,
            amount: balance,
            transactionNote: `Invoice ${invoice.invoiceNumber || invoice.id}`,
            transactionRef: invoice.invoiceNumber || invoice.id,
          });
          const url = await generateUpiQrDataUrl(uri, { width: 200 });
          setQrCodeUrl(url);
        } catch (e) {
          console.error("Failed to load invoice QR:", e);
        }
      }
    }
    loadQr();
  }, [isPaid, balance, upiId, businessName, invoice]);

  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [
        {
          id: "item-1",
          description: invoice.service || invoice.notes || "Professional Consultation & Service Package",
          quantity: 1,
          rate: total,
          amount: total,
        },
      ];

  const subtotal = invoice.subtotal ? Number(invoice.subtotal) : total;
  const tax = invoice.tax ? Number(invoice.tax) : 0;
  const discount = invoice.discount ? Number(invoice.discount) : 0;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95">
        {/* Modal Controls Header (Not in print) */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 dark:border-slate-800 print:hidden bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Tax Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isPaid
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : isOverdue
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {invoice.status || "Pending"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 print:p-0">
          {/* Top Header: Business & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white text-sm">
                  {businessName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {businessName}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">GSTIN: {businessGstin}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 leading-relaxed max-w-xs">
                {businessAddress}
                <br />
                Phone: {businessPhone} • {businessEmail}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                TAX INVOICE
              </h1>
              <p className="mt-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
              </p>
              <div className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                <div>Date: {invoice.issueDate || invoice.date || "Today"}</div>
                {invoice.dueDate && <div>Due: {invoice.dueDate}</div>}
              </div>
            </div>
          </div>

          {/* Billed To */}
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To:
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {customerName}
            </h4>
            <p className="text-xs text-slate-500">{customerEmail}</p>
            {customerPhone && <p className="text-xs text-slate-500">{customerPhone}</p>}
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800/80">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {item.description || item.name}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">
                      {item.quantity || 1}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 font-mono">
                      ₹{Number(item.rate || item.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                      ₹{Number(item.amount || item.rate || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown & UPI QR */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            {!isPaid && balance > 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/40 dark:bg-slate-800/60">
                {qrCodeUrl ? (
                  <div className="relative rounded-xl bg-white p-1.5 shadow-xs border border-slate-200 shrink-0">
                    <img src={qrCodeUrl} alt="UPI QR Code" className="h-24 w-24 object-contain" />
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-slate-100 animate-pulse rounded-xl shrink-0" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                    <QrCode size={13} />
                    <span>Scan to Pay (UPI)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 max-w-[160px] leading-tight">
                    Pay balance of ₹{balance.toLocaleString("en-IN")} via GPay, PhonePe, or Paytm.
                  </p>
                  <p className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {upiId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Payment Terms:</p>
                <p>UPI, Net Banking, or Credit/Debit Card settlements accepted.</p>
                <p className="italic text-emerald-600 font-semibold">Invoice settled in full. Thank you!</p>
              </div>
            )}

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST / Tax:</span>
                  <span className="font-mono">+₹{tax.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Total Amount:</span>
                <span className="font-mono">₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Amount Paid:</span>
                <span className="font-mono">₹{paid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                <span>Balance Due:</span>
                <span className="font-mono">₹{balance.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Not in print) */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Official verified merchant receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>

            {!isPaid && balance > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPayment?.(invoice);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition active:scale-95"
              >
                <CreditCard size={14} />
                <span>Pay Balance (₹{balance.toLocaleString("en-IN")})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
