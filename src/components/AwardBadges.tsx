import Tooltip from "./Tooltip";
import { getAward } from "@/lib/awards";
import { getTeamAwards } from "@/lib/recapData";

// A team's earned awards as compact badges for the team page header;
// hovering (or tapping) one shows the full description and which weeks
// it was earned.
export default function AwardBadges({ teamName }: { teamName: string }) {
  const awards = getTeamAwards(teamName);
  if (awards.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {awards.map(({ award: id, weeks }) => {
        const award = getAward(id);
        return (
          <Tooltip
            key={id}
            label={`${award.description} (Wk ${weeks.join(", ")})`}
            className="cursor-default"
          >
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium dark:border-neutral-800 dark:bg-neutral-900">
              <span aria-hidden>{award.emoji}</span>
              {award.name}
              {weeks.length > 1 && (
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  ×{weeks.length}
                </span>
              )}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}
