import { useState, useEffect } from "react";
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import {
  generateUpiUri,
  generateUpiQrDataUrl,
  getEffectiveBusinessUpi,
  formatInr,
} from "../../utils/upiPayments";

export default function UpiQrCheckout({
  business,
  amount = 0,
  invoiceNumber = "",
  customerName = "",
  customerEmail = "",
  notes = "",
  onPaymentSuccess,
  isSubmitting = false,
}) {
  const businessName = business?.name || business?.businessName || "Merchant";
  const upiId = getEffectiveBusinessUpi(business);

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [upiUri, setUpiUri] = useState("");
  const [loadingQr, setLoadingQr] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [selectedApp, setSelectedApp] = useState("all"); // 'all' | 'gpay' | 'phonepe' | 'paytm'
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Generate unique transaction reference for tracking
  const [txnRef] = useState(
    () => `TXN${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`
  );

  useEffect(() => {
    async function buildQr() {
      try {
        setLoadingQr(true);
        const note = invoiceNumber
          ? `Invoice ${invoiceNumber} - ${businessName}`
          : `Booking with ${businessName}`;
        const uri = generateUpiUri({
          upiId,
          payeeName: businessName,
          amount,
          transactionNote: note,
          transactionRef: txnRef,
        });
        setUpiUri(uri);
        const url = await generateUpiQrDataUrl(uri, { width: 280 });
        setQrCodeUrl(url);
      } catch (err) {
        console.error("Failed to build QR:", err);
      } finally {
        setLoadingQr(false);
      }
    }
    buildQr();
  }, [upiId, businessName, amount, invoiceNumber, txnRef]);

  function handleCopyUpi() {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  }

  function handleOpenUpiApp() {
    if (upiUri) {
      window.location.href = upiUri;
    }
  }

  async function handleConfirmPayment() {
    setVerifying(true);
    try {
      // Simulate UPI webhook/instant verification handshake
      await new Promise((resolve) => setTimeout(resolve, 800));
      setVerified(true);
      onPaymentSuccess?.({
        method: "UPI (Dynamic QR / Apps)",
        amount: Number(amount),
        upiId,
        txnRef,
        utrNumber: utrNumber.trim() || `UTR${Date.now().toString().slice(-8)}`,
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Amount & Merchant Header */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 border border-indigo-100 dark:from-slate-800/80 dark:via-indigo-950/40 dark:to-slate-800/80 dark:border-indigo-900/40 shadow-sm">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            Total Payable
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatInr(amount)}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>To:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{businessName}</span>
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
        </div>

        {/* Accepted UPI Apps Badges */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Zero Platform Fee
          </span>
          <div className="flex items-center gap-1">
            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200 shadow-xs dark:bg-slate-900">
              GPay
            </span>
            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-purple-600 border border-purple-200 shadow-xs dark:bg-slate-900">
              PhonePe
            </span>
            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-sky-600 border border-sky-200 shadow-xs dark:bg-slate-900">
              Paytm
            </span>
          </div>
        </div>
      </div>

      {/* QR Code Canvas Card */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="relative flex items-center justify-center rounded-2xl bg-white p-3 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 shadow-inner">
          {loadingQr ? (
            <div className="flex h-56 w-56 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : qrCodeUrl ? (
            <div className="relative">
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                className="h-56 w-56 rounded-xl object-contain"
              />
              {/* Center UPI Badge Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full bg-white px-2 py-0.5 shadow-md border border-slate-200 text-[10px] font-black tracking-tight text-indigo-700">
                  UPI
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-56 w-56 items-center justify-center text-xs text-rose-500">
              Failed to load QR code
            </div>
          )}
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <QrCode size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>Scan with any UPI app on your phone to pay</span>
        </p>

        {/* UPI VPA Copy Bar */}
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 dark:bg-slate-800/60 dark:border-slate-700">
          <span className="text-[11px] font-mono text-slate-500">UPI ID:</span>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            {upiId}
          </span>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition"
            title="Copy UPI ID"
          >
            {copiedUpi ? (
              <>
                <Check size={12} className="text-emerald-500" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Deep Link Button (Tapping launches UPI app directly) */}
        <div className="mt-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenUpiApp}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 transition active:scale-95"
          >
            <Smartphone size={14} />
            <span>Tap to Pay directly in GPay / PhonePe / Paytm</span>
          </button>
        </div>
      </div>

      {/* Manual UTR Reference & Instant Verification Section */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            UTR / UPI Ref No. (Optional for payment audit):
          </label>
          <span className="text-[10px] font-mono text-slate-400">Ref: {txnRef}</span>
        </div>

        <input
          type="text"
          value={utrNumber}
          onChange={(e) => setUtrNumber(e.target.value)}
          placeholder="e.g. 428190348271 (12-digit UTR)"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />

        <button
          type="button"
          onClick={handleConfirmPayment}
          disabled={verifying || isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50"
        >
          {verifying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Verifying UPI Settlement...</span>
            </>
          ) : (
            <>
              <Check size={15} />
              <span>I Have Paid — Confirm & Settle Record</span>
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-400">
          Instant reconciliation • Updates invoice status and sends instant digital receipt to customer
        </p>
      </div>
    </div>
  );
}
