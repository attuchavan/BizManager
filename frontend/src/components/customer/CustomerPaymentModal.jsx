import { useState } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  Building,
  QrCode,
  Sparkles,
} from "lucide-react";
import { createPayment } from "../../services/firebase/payments";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { createNotification } from "../../services/firebase/notifications";
import UpiQrCheckout from "../common/UpiQrCheckout";
import { formatInr } from "../../utils/upiPayments";

export default function CustomerPaymentModal({
  isOpen,
  onClose,
  invoice,
  business,
  customer,
  onPaymentSuccess,
}) {
  if (!isOpen || !invoice) return null;

  const businessId = business?.id || business?.businessId;
  const businessName = business?.name || business?.businessName || "BizManager Service";

  const total = Number(invoice.total || invoice.amount || 0);
  const paidAlready = Number(invoice.paid || 0);
  const dueAmount =
    invoice.balance !== undefined ? Number(invoice.balance) : Math.max(0, total - paidAlready);

  const [amount, setAmount] = useState(dueAmount || total);
  const [activeTab, setActiveTab] = useState("upi_qr"); // 'upi_qr' | 'cards_bank'
  const [method, setMethod] = useState("UPI (GooglePay / PhonePe)");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const customerName = invoice.customerName || customer?.name || "Client";
  const customerEmail = invoice.customerEmail || customer?.email || "";

  // Common payment settlement handler
  async function executeSettlement(paymentDetails = {}) {
    if (!businessId || !invoice.id) return;

    try {
      setSubmitting(true);
      setError("");

      const paymentNumber = Number(paymentDetails.amount || amount);
      const newPaidTotal = paidAlready + paymentNumber;
      const newBalance = Math.max(0, total - newPaidTotal);
      const newStatus = newBalance <= 0 ? "Paid" : "Partially Paid";
      const payMethod = paymentDetails.method || method;
      const txnRef = paymentDetails.txnRef || paymentDetails.utrNumber || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Record payment in Firestore
      const paymentRecord = await createPayment(businessId, {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8),
        customerName,
        customerEmail,
        amount: paymentNumber,
        method: payMethod,
        date: new Date().toISOString().split("T")[0],
        status: "Completed",
        transactionRef: txnRef,
        notes: paymentDetails.utrNumber ? `UTR: ${paymentDetails.utrNumber}` : "Direct Online Settlement",
      });

      // 2. Update invoice status & balance in Firestore
      const invoiceRef = doc(db, "businesses", businessId, "invoices", invoice.id);
      await updateDoc(invoiceRef, {
        paid: newPaidTotal,
        balance: newBalance,
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // 3. Create customer notification
      if (customerEmail) {
        await createNotification(businessId, {
          recipientEmail: customerEmail,
          title: "Payment Received",
          message: `₹${paymentNumber.toLocaleString("en-IN")} received for invoice #${
            invoice.invoiceNumber || invoice.id.slice(0, 8)
          }. Thank you!`,
          type: "payment",
          entityId: invoice.id,
        });
      }

      setSuccess(true);
      onPaymentSuccess?.(paymentRecord);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2200);
    } catch (err) {
      console.error("Payment settlement error:", err);
      setError(err.message || "Failed to process payment settlement.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }
    executeSettlement({ amount, method });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Settle Invoice Balance
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        {!success && (
          <div className="flex items-center gap-1.5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("upi_qr")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "upi_qr"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <QrCode size={14} />
              <span>Instant UPI QR Code</span>
            </button>
            <button
              onClick={() => setActiveTab("cards_bank")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "cards_bank"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <CreditCard size={14} />
              <span>Card / Net Banking</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-10 text-center animate-in fade-in zoom-in-95 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 shadow-md shadow-emerald-500/20">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Payment Confirmed & Settled!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {formatInr(amount)} settled successfully for <strong>{businessName}</strong>. Invoice balance has been updated in live records.
              </p>
            </div>
          ) : activeTab === "upi_qr" ? (
            /* TAB 1: INSTANT UPI DYNAMIC QR CODE */
            <UpiQrCheckout
              business={business}
              amount={dueAmount || total}
              invoiceNumber={invoice.invoiceNumber || invoice.id}
              customerName={customerName}
              customerEmail={customerEmail}
              onPaymentSuccess={(details) => executeSettlement(details)}
              isSubmitting={submitting}
            />
          ) : (
            /* TAB 2: MANUAL / CARD SETTLEMENT FORM */
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-900 dark:text-indigo-300 font-semibold">
                    Outstanding Balance:
                  </span>
                  <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-400 font-mono">
                    {formatInr(dueAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount to Settle (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={dueAmount || total}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Channel
                </label>
                <div className="space-y-2">
                  {[
                    { id: "Credit / Debit Card", label: "Credit or Debit Card", icon: CreditCard },
                    { id: "Net Banking", label: "Internet Banking / NEFT", icon: Building },
                    { id: "Cheque / Cash Counter", label: "Counter Deposit / Cheque", icon: Smartphone },
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = method === ch.id;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => setMethod(ch.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-300 font-bold"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <Icon
                          size={16}
                          className={isSelected ? "text-indigo-600" : "text-slate-400"}
                        />
                        <span>{ch.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Authorize {formatInr(amount)}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
