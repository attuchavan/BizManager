import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Construction } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";

function ModulePlaceholder({ title, description, icon: Icon = Construction }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace Module"
        title={title}
        description={description || `${title} module is currently being configured for your business.`}
        action={
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        }
      />

      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner dark:bg-blue-500/10 dark:text-blue-400">
          <Icon size={32} />
        </div>

        <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
          {title} Module Coming Soon
        </h3>

        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          This intelligent feature is part of your AI Business Manager suite. In the meantime, you can explore customer records, analytics overviews, and AI actions from the main dashboard.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/app"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
          >
            Go to Dashboard
          </Link>

          <Link
            to="/app/customers"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Manage Customers
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ModulePlaceholder;
