/**
 * UPI Payments Utility
 * Compliant with NPCI (National Payments Corporation of India) UPI Deep Linking Spec.
 * Generates dynamic UPI payment strings and QR codes compatible with:
 * Google Pay, PhonePe, Paytm, BHIM, Cred, Amazon Pay, and all Indian banking apps.
 */

import QRCode from "qrcode";

/**
 * Standard NPCI UPI URI Builder
 * Format: upi://pay?pa={VPA}&pn={PayeeName}&am={Amount}&cu=INR&tn={Note}&tr={RefId}
 */
export function generateUpiUri({
  upiId,
  payeeName = "Merchant",
  amount = 0,
  transactionNote = "Payment",
  transactionRef = "",
}) {
  const cleanUpiId = (upiId || "business@okhdfcbank").trim();
  const cleanPayee = encodeURIComponent(payeeName.trim().slice(0, 50));
  const cleanNote = encodeURIComponent(transactionNote.trim().slice(0, 50));
  const refId = transactionRef || `TXN${Date.now()}`;
  const cleanRef = encodeURIComponent(refId.slice(0, 35));
  const cleanAmount = Number(amount || 0).toFixed(2);

  return `upi://pay?pa=${cleanUpiId}&pn=${cleanPayee}&am=${cleanAmount}&cu=INR&tn=${cleanNote}&tr=${cleanRef}`;
}

/**
 * Generate a high-resolution QR Code Data URL from a UPI URI.
 */
export async function generateUpiQrDataUrl(upiUri, options = {}) {
  try {
    const dataUrl = await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: options.width || 280,
      color: {
        dark: options.darkColor || "#0f172a",
        light: options.lightColor || "#ffffff",
      },
      ...options,
    });
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate UPI QR code:", err);
    throw err;
  }
}

/**
 * Resolve effective UPI ID for a business workspace.
 */
export function getEffectiveBusinessUpi(business = {}) {
  if (business?.upiId && business.upiId.trim()) {
    return business.upiId.trim();
  }
  const cleanName = (business?.businessName || business?.name || "merchant")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `${cleanName || "merchant"}@okhdfcbank`;
}

/**
 * Format currency in Indian numbering format (e.g. ₹1,25,000)
 */
export function formatInr(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}
