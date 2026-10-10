function PageHeader({
  title,
  description,
  action,
  eyebrow,
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {eyebrow}
          </p>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
            {description}
          </p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;