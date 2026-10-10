/**
 * Business Terminology Utility
 * Adapts UI terminology based on the registered businessType
 * without breaking underlying database schemas.
 */

export const BUSINESS_TYPES = [
  "Restaurant & Food",
  "Salon & Spa",
  "Gym & Fitness",
  "Clinic & Healthcare",
  "Coaching & Education",
  "Real Estate",
  "Retail & E-commerce",
  "Repair & Services",
  "Agency & Marketing",
  "Consulting",
  "Freelancer",
  "Other",
];

const TERMINOLOGY_CONFIGS = {
  "Salon & Spa": {
    customer: "Client",
    customers: "Clients",
    employee: "Stylist / Therapist",
    employees: "Stylists & Therapists",
    service: "Service / Treatment",
    services: "Services & Treatments",
    appointment: "Appointment",
    appointments: "Appointments",
    newCustomer: "Add Client",
    bookAppointment: "Book Appointment",
    industryNote: "Track client treatments, preferred stylists, and repeat visits.",
  },
  "Clinic & Healthcare": {
    customer: "Patient",
    customers: "Patients",
    employee: "Doctor / Specialist",
    employees: "Doctors & Medical Staff",
    service: "Consultation / Treatment",
    services: "Consultations & Procedures",
    appointment: "Consultation",
    appointments: "Consultations",
    newCustomer: "Register Patient",
    bookAppointment: "Schedule Consultation",
    industryNote: "Manage patient history, consultations, prescriptions, and follow-ups.",
  },
  "Gym & Fitness": {
    customer: "Member",
    customers: "Members",
    employee: "Trainer / Instructor",
    employees: "Trainers & Coaches",
    service: "Class / Plan",
    services: "Classes & Memberships",
    appointment: "Session",
    appointments: "Training Sessions",
    newCustomer: "Enroll Member",
    bookAppointment: "Book Training Session",
    industryNote: "Track membership renewals, attendance, and private training sessions.",
  },
  "Restaurant & Food": {
    customer: "Guest / Customer",
    customers: "Guests & Customers",
    employee: "Staff / Chef",
    employees: "Service Staff & Kitchen",
    service: "Menu Item / Package",
    services: "Catering & Menu Packages",
    appointment: "Table Reservation",
    appointments: "Reservations",
    newCustomer: "Add Guest",
    bookAppointment: "Reserve Table",
    industryNote: "Manage guest bookings, catering invoices, and event reservations.",
  },
  "Coaching & Education": {
    customer: "Student",
    customers: "Students",
    employee: "Instructor / Teacher",
    employees: "Faculty & Instructors",
    service: "Course / Batch",
    services: "Courses & Programs",
    appointment: "Lecture / Mentoring",
    appointments: "Mentoring Sessions",
    newCustomer: "Enroll Student",
    bookAppointment: "Schedule 1-on-1",
    industryNote: "Manage student batches, tuition fees, and doubt clearing sessions.",
  },
  "Real Estate": {
    customer: "Buyer / Tenant",
    customers: "Buyers & Investors",
    employee: "Broker / Agent",
    employees: "Brokers & Agents",
    service: "Property Listing / Tour",
    services: "Consultations & Site Visits",
    appointment: "Site Visit",
    appointments: "Site Visits",
    newCustomer: "Add Buyer",
    bookAppointment: "Schedule Site Visit",
    industryNote: "Track prospective buyers, site visit schedules, and commission invoices.",
  },
  "Repair & Services": {
    customer: "Customer",
    customers: "Customers",
    employee: "Technician / Engineer",
    employees: "Technicians",
    service: "Repair Service / Job",
    services: "Repair & Diagnostic Services",
    appointment: "Service Visit",
    appointments: "Service Visits",
    newCustomer: "New Service Request",
    bookAppointment: "Book Service Call",
    industryNote: "Track diagnostic visits, repair parts, invoices, and warranty follow-ups.",
  },
  "Agency & Marketing": {
    customer: "Client",
    customers: "Clients",
    employee: "Account Manager",
    employees: "Creative & Growth Team",
    service: "Campaign / Retainer",
    services: "Marketing Deliverables",
    appointment: "Strategy Review",
    appointments: "Client Meetings",
    newCustomer: "Onboard Client",
    bookAppointment: "Schedule Review",
    industryNote: "Track marketing retainers, deliverable invoices, and project syncs.",
  },
  "Consulting": {
    customer: "Client",
    customers: "Clients",
    employee: "Consultant / Partner",
    employees: "Consultants & Advisors",
    service: "Advisory / Audit",
    services: "Consulting Engagements",
    appointment: "Advisory Session",
    appointments: "Client Sessions",
    newCustomer: "Add Client",
    bookAppointment: "Book Advisory Call",
    industryNote: "Track retainer billings, strategy sessions, and client deliverables.",
  },
  "Freelancer": {
    customer: "Client",
    customers: "Clients",
    employee: "Collaborator",
    employees: "Collaborators",
    service: "Gig / Deliverable",
    services: "Services & Deliverables",
    appointment: "Discovery Call",
    appointments: "Client Calls",
    newCustomer: "Add Client",
    bookAppointment: "Schedule Call",
    industryNote: "Manage project milestones, freelance invoices, and client calls.",
  },
  "Retail & E-commerce": {
    customer: "Customer",
    customers: "Customers",
    employee: "Sales Executive",
    employees: "Floor & Sales Staff",
    service: "Product / Catalog",
    services: "Products & Packages",
    appointment: "Store Visit / Demo",
    appointments: "Personal Shopping",
    newCustomer: "Add Customer",
    bookAppointment: "Schedule Demo",
    industryNote: "Track customer purchases, POS receipts, and VIP shopping appointments.",
  },
};

const DEFAULT_TERMINOLOGY = {
  customer: "Customer",
  customers: "Customers",
  employee: "Employee",
  employees: "Employees",
  service: "Service",
  services: "Services",
  appointment: "Appointment",
  appointments: "Appointments",
  newCustomer: "Add Customer",
  bookAppointment: "Book Appointment",
  industryNote: "Manage your business operations, pipeline, and customer relationships.",
};

/**
 * Returns adapted terminology based on businessType.
 * Fallbacks cleanly to standard business terms.
 */
export function getBusinessTerminology(businessType) {
  if (!businessType) return DEFAULT_TERMINOLOGY;

  // Exact match
  if (TERMINOLOGY_CONFIGS[businessType]) {
    return TERMINOLOGY_CONFIGS[businessType];
  }

  // Substring match
  const lower = businessType.toLowerCase();
  for (const [key, config] of Object.entries(TERMINOLOGY_CONFIGS)) {
    if (lower.includes(key.toLowerCase().split(" ")[0])) {
      return config;
    }
  }

  return DEFAULT_TERMINOLOGY;
}
