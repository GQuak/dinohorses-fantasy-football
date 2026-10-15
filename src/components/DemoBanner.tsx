export default function DemoBanner() {
  return (
    <div className="mx-auto mb-4 max-w-6xl px-4 sm:px-6">
      <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Showing sample data — no ESPN league is configured yet. Add your league IDs
        (and cookies, for private leagues) to <code>.env.local</code> to see real data.
        See the README for setup steps.
      </div>
    </div>
  );
}

export function ErrorBanner({
  errors,
}: {
  errors: { leagueName: string; message: string }[];
}) {
  if (errors.length === 0) return null;
  return (
    <div className="mx-auto mb-4 max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-1 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        {errors.map((e) => (
          <p key={e.leagueName}>
            <strong>{e.leagueName}:</strong> {e.message}
          </p>
        ))}
      </div>
    </div>
  );
}
