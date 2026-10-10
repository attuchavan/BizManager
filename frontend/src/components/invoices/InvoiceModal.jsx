import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2, IndianRupee, User, Calendar, Receipt, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCustomers } from "../../services/firebase/customers";
import { getServices } from "../../services/firebase/services";

export default function InvoiceModal({ isOpen, onClose, onSave, invoice = null }) {
  const isEdit = Boolean(invoice);
  const { activeBusiness } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [catalogServices, setCatalogServices] = useState([]);

  const [form, setForm] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    items: [{ description: "Business Consultation & Advisory", quantity: 1, rate: 15000 }],
    taxPercent: 18,
    discount: 0,
    status: "Pending",
    notes: "Payment due within 14 days. Thank you for your business!",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function loadMetadata() {
      if (activeBusiness?.businessId) {
        try {
          const [custData, srvData] = await Promise.all([
            getCustomers(activeBusiness.businessId),
            getServices(activeBusiness.businessId),
          ]);
          if (custData) setCustomers(custData);
          if (srvData) setCatalogServices(srvData);
        } catch (e) {
          console.error("Error loading invoice form metadata:", e);
        }
      }
    }
    if (isOpen) {
      loadMetadata();
    }
  }, [activeBusiness?.businessId, isOpen]);

  useEffect(() => {
    if (invoice) {
      setForm({
        invoiceNumber: invoice.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        customerId: invoice.customerId || "",
        customerName: invoice.customerName || "",
        customerEmail: invoice.customerEmail || "",
        customerPhone: invoice.customerPhone || "",
        issueDate: invoice.issueDate || new Date().toISOString().split("T")[0],
        dueDate: invoice.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        items: invoice.items?.length
          ? invoice.items
          : [{ description: "Service / Product Item", quantity: 1, rate: 5000 }],
        taxPercent: invoice.taxPercent ?? 18,
        discount: invoice.discount ?? 0,
        status: invoice.status || "Pending",
        notes: invoice.notes || "Thank you for your business!",
      });
    } else {
      setForm({
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        items: [{ description: "Consultation & Services", quantity: 1, rate: 10000 }],
        taxPercent: 18,
        discount: 0,
        status: "Pending",
        notes: "Payment due within 14 days. Please settle via UPI or Net Banking.",
      });
    }
    setErrors({});
    setSubmitError("");
  }, [invoice, isOpen]);

  if (!isOpen) return null;

  // Item row operations
  function handleItemChange(index, field, value) {
    const updated = [...form.items];
    updated[index][field] = field === "description" ? value : Number(value) || 0;
    setForm((prev) => ({ ...prev, items: updated }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, rate: 0 }],
    }));
  }

  function removeItem(index) {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  // Calculations
  const subtotal = form.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );
  const taxAmount = (subtotal * (Number(form.taxPercent) || 0)) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - (Number(form.discount) || 0));

  function validate() {
    const newErrors = {};
    if (!form.customerName.trim()) {
      newErrors.customerName = "Customer name is required.";
    }
    if (!form.invoiceNumber.trim()) {
      newErrors.invoiceNumber = "Invoice number is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        invoiceNumber: form.invoiceNumber.trim(),
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        items: form.items,
        subtotal,
        taxPercent: Number(form.taxPercent) || 0,
        taxAmount,
        discount: Number(form.discount) || 0,
        total: grandTotal,
        status: form.status,
        notes: form.notes.trim(),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save invoice error:", err);
      setSubmitError(err.message || "Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt size={18} className="text-blue-600" />
              {isEdit ? "Edit Invoice" : "Create New Invoice"}
            </h3>
            <p className="text-xs text-slate-500">
              Generate itemized bill with tax, discount, and due date
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {submitError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
              {submitError}
            </div>
          )}

          {/* Invoice Number & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Invoice Number *
              </label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Customer Selection & Details */}
          <div className="space-y-3">
            {customers.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Select Saved Customer</span>
                  <span className="text-[11px] font-normal text-slate-400">or type below</span>
                </label>
                <select
                  value={form.customerId || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const cust = customers.find((c) => c.id === id);
                    if (cust) {
                      setForm((prev) => ({
                        ...prev,
                        customerId: cust.id,
                        customerName: cust.name || "",
                        customerEmail: cust.email || "",
                        customerPhone: cust.phone || "",
                      }));
                    } else {
                      setForm((prev) => ({ ...prev, customerId: "" }));
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50/40 py-2 px-3 text-xs outline-none focus:border-blue-500 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-white"
                >
                  <option value="">-- Choose from existing customers --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} {c.company ? `• ${c.company}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.customerName ? "border-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="rahul@example.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Issue Date
              </label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Itemized Services / Products
                </label>
                <p className="text-[11px] text-slate-400">
                  Select from your catalog or enter custom line items
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {form.items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  {catalogServices.length > 0 && (
                    <select
                      onChange={(e) => {
                        const srv = catalogServices.find((s) => s.id === e.target.value);
                        if (srv) {
                          handleItemChange(index, "description", srv.name);
                          handleItemChange(index, "rate", srv.price || 0);
                        }
                      }}
                      defaultValue=""
                      className="sm:w-36 rounded-lg border border-slate-200 py-1.5 px-2 text-[11px] outline-none bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    >
                      <option value="">Catalog Item...</option>
                      {catalogServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (₹{s.price})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    placeholder="Item description..."
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 py-1.5 px-2 text-xs text-center outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Rate (₹)"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 py-1.5 px-2 text-xs text-right outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                    />
                    <span className="w-24 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      ₹{((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toLocaleString("en-IN")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={form.items.length <= 1}
                      className="rounded p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary: Subtotal, Tax, Discount & Total */}
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Tax / GST (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.taxPercent}
                onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
                className="w-20 rounded-lg border border-slate-200 py-1 px-2 text-right text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="w-24 rounded-lg border border-slate-200 py-1 px-2 text-right text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:text-white">
              <span>Grand Total:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold font-mono">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Terms & Payment Instructions
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50 active:scale-95"
            >
              {loading && <Loader2 size={14} className="animate-spin text-emerald-400" />}
              {isEdit ? "Update Invoice" : "Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
