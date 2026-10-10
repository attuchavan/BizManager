import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Briefcase,
  UserCheck,
  MapPin,
  FileText,
  Mail,
} from "lucide-react";

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  appointment = null,
  customers = [],
  services = [],
  employees = [],
}) {
  const isEdit = Boolean(appointment);

  const [form, setForm] = useState({
    customerId: "",
    clientName: "",
    email: "",
    phone: "",
    serviceId: "",
    service: "Executive Business Consultation",
    assignedEmployee: "Unassigned",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration: "45 mins",
    locationType: "Online (Google Meet)",
    meetingLink: "",
    status: "Confirmed",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (appointment) {
      setForm({
        customerId: appointment.customerId || "",
        clientName: appointment.clientName || appointment.customerName || "",
        email: appointment.email || "",
        phone: appointment.phone || "",
        serviceId: appointment.serviceId || "",
        service: appointment.service || appointment.serviceName || "Executive Business Consultation",
        assignedEmployee: appointment.assignedEmployee || "Unassigned",
        date: appointment.date || new Date().toISOString().split("T")[0],
        time: appointment.time || "10:00",
        duration: appointment.duration || "45 mins",
        locationType: appointment.locationType || "Online (Google Meet)",
        meetingLink: appointment.meetingLink || "",
        status: appointment.status || "Confirmed",
        notes: appointment.notes || "",
      });
    } else {
      setForm({
        customerId: "",
        clientName: "",
        email: "",
        phone: "",
        serviceId: "",
        service: services[0]?.name || "Executive Business Consultation",
        assignedEmployee: employees[0]?.name || "Unassigned",
        date: new Date().toISOString().split("T")[0],
        time: "10:00",
        duration: "45 mins",
        locationType: "Online (Google Meet)",
        meetingLink: "https://meet.google.com/biz-mgmt",
        status: "Confirmed",
        notes: "",
      });
    }
    setErrors({});
    setSubmitError("");
  }, [appointment, isOpen, services, employees]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  // When a customer is picked from dropdown
  function handleSelectCustomer(custId) {
    if (!custId) {
      setForm((prev) => ({ ...prev, customerId: "" }));
      return;
    }
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        customerId: custId,
        clientName: found.name,
        email: found.email || prev.email,
        phone: found.phone || prev.phone,
      }));
    }
  }

  // When a service is picked from dropdown
  function handleSelectService(srvId) {
    if (!srvId) return;
    const found = services.find((s) => s.id === srvId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        serviceId: srvId,
        service: found.name,
        duration: found.duration || prev.duration,
      }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.clientName.trim()) {
      newErrors.clientName = "Client name is required.";
    }
    if (!form.date) {
      newErrors.date = "Appointment date is required.";
    }
    if (!form.time) {
      newErrors.time = "Time is required.";
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
        customerId: form.customerId,
        clientName: form.clientName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        serviceId: form.serviceId,
        service: form.service,
        assignedEmployee: form.assignedEmployee,
        date: form.date,
        time: form.time,
        duration: form.duration,
        locationType: form.locationType,
        meetingLink: form.meetingLink.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save appointment error:", err);
      setSubmitError(err.message || "Failed to schedule appointment.");
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

      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Appointment" : "Schedule New Appointment"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit
                ? "Update booking session, service, staff assignee, or date."
                : "Schedule a client consultation with calendar synchronization."}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {submitError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
              {submitError}
            </div>
          )}

          {/* Quick Select Customer or Manual */}
          {customers.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Link Existing Customer (Optional)
              </label>
              <select
                value={form.customerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">-- Choose from Customer Database or Type Below --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company || "Individual"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Client Name & Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Client Name *
              </label>
              <div className="relative mt-1">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  placeholder="e.g. Priya Patil"
                  className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.clientName ? "border-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.clientName && <p className="mt-1 text-[11px] text-rose-500">{errors.clientName}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone / WhatsApp Number
              </label>
              <div className="relative mt-1">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Client Email Address
            </label>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="priya@example.com"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Service & Assigned Employee */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Service Type
              </label>
              <div className="relative mt-1">
                <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  name="service"
                  value={form.service}
                  onChange={(e) => {
                    handleChange(e);
                    const found = services.find((s) => s.name === e.target.value);
                    if (found?.duration) {
                      setForm((prev) => ({ ...prev, duration: found.duration }));
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.duration || "45m"} - ₹{s.price})
                    </option>
                  ))}
                  {services.length === 0 && (
                    <>
                      <option value="Executive Business Consultation">Executive Business Consultation</option>
                      <option value="Service Appointment">Service Appointment</option>
                      <option value="Digital Setup & Onboarding">Digital Setup & Onboarding</option>
                      <option value="Financial Audit Session">Financial Audit Session</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <UserCheck size={14} className="text-blue-500" />
                Assigned Team Member
              </label>
              <select
                name="assignedEmployee"
                value={form.assignedEmployee}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Unassigned">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.role || "Staff"})
                  </option>
                ))}
                {employees.length === 0 && (
                  <>
                    <option value="Atharv Chavan">Atharv Chavan</option>
                    <option value="Neha Sharma">Neha Sharma</option>
                    <option value="Rohan Varma">Rohan Varma</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Duration
              </label>
              <select
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="15 mins">15 mins</option>
                <option value="30 mins">30 mins</option>
                <option value="45 mins">45 mins</option>
                <option value="60 mins">60 mins (1 hr)</option>
                <option value="90 mins">90 mins (1.5 hr)</option>
                <option value="2 hrs">2 hrs</option>
              </select>
            </div>
          </div>

          {/* Meeting Mode & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Meeting Mode / Location
              </label>
              <select
                name="locationType"
                value={form.locationType}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Online (Google Meet)">Online (Google Meet / Zoom)</option>
                <option value="In-Person (Office)">In-Person (Office)</option>
                <option value="Phone Call">Phone Call</option>
                <option value="On-Site (Client Office)">On-Site (Client Office)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Online Link or Venue Details */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Meeting URL or Room / Location
            </label>
            <input
              type="text"
              name="meetingLink"
              value={form.meetingLink}
              onChange={handleChange}
              placeholder="https://meet.google.com/abc-defg-hij or Conference Room 1"
              className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Meeting Agenda & Preparation Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              value={form.notes}
              onChange={handleChange}
              placeholder="Discussion points, required client documents, or follow-up milestones..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin text-emerald-300" />}
              {isEdit ? "Update Appointment" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
