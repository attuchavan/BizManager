import {
  Home,
  Compass,
  CalendarDays,
  Receipt,
  Plus,
  Layers,
  User,
} from "lucide-react";

export default function CustomerMobileNav({
  activeTab,
  setActiveTab,
  onOpenBooking,
  terminology,
}) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "book", label: "Book", icon: Plus, isSpecial: true },
    { id: "appointments", label: "Bookings", icon: CalendarDays },
    { id: "invoices", label: "Billing", icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 py-1.5 px-3">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={onOpenBooking}
                className="flex flex-col items-center -mt-5 transition transform active:scale-90"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/35 border-2 border-white dark:border-slate-900">
                  <Plus size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Book
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[55px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
