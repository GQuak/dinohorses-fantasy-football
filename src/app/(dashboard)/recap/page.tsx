import { redirect } from "next/navigation";
import { getLatestRecap } from "@/lib/recapData";

// /recap has no content of its own -- it always means "whatever the
// current week is," so it redirects to that week's real, permanent
// address (/recap/[week]) rather than rendering the same content at two
// different URLs. Nav links here and always land on the freshest recap;
// a link to a specific past week (shared from /recap/N) stays stable
// even after a newer week gets published.
export default function RecapIndexPage() {
  const recap = getLatestRecap();

  if (!recap) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-xl font-semibold">Weekly Recap</h2>
        <p className="mt-2 text-sm text-neutral-500">No recap has been published yet.</p>
      </div>
    );
  }

  redirect(`/recap/${recap.week}`);
}
