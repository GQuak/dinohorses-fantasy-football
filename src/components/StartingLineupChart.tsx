import PlayerAvatar from "./PlayerAvatar";
import Tooltip from "./Tooltip";
import ModeToggle from "./ModeToggle";
import { playerHeadshotUrl, teamLogoUrl } from "@/lib/constants";
import { rankFraction } from "@/lib/rank";
import type { StarterRankInfo } from "@/lib/types";

const MAX_BAR_HEIGHT = 140;

function tierClasses(rank: number, total: number): { bar: string; text: string } {
  if (total <= 0 || rank <= 0) {
    return { bar: "bg-neutral-300 dark:bg-neutral-700", text: "text-neutral-400" };
  }
  const pct = rank / total;
  if (pct <= 1 / 3) {
    return {
      bar: "bg-emerald-400 dark:bg-emerald-600",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (pct <= 2 / 3) {
    return { bar: "bg-amber-400 dark:bg-amber-600", text: "text-amber-700 dark:text-amber-400" };
  }
  return { bar: "bg-rose-400 dark:bg-rose-600", text: "text-rose-700 dark:text-rose-400" };
}

export default function StartingLineupChart({
  slots,
  mode,
  onModeChange,
  currentWeek,
}: {
  slots: StarterRankInfo[];
  mode: "season" | "week";
  onModeChange: (mode: "season" | "week") => void;
  currentWeek: number;
}) {
  const periodLabel = mode === "season" ? "season" : `week ${currentWeek}`;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Starting Lineup</h3>
        <ModeToggle mode={mode} onChange={onModeChange} currentWeek={currentWeek} />
      </div>
      <div className="flex items-end justify-between gap-0.5 sm:gap-1">
        {slots.map((s) => {
          const height = Math.max(
            6,
            rankFraction(s.positionRank, s.totalAtPosition) * MAX_BAR_HEIGHT
          );
          const colors = tierClasses(s.positionRank, s.totalAtPosition);
          const avatarSrc =
            s.player.position === "D/ST"
              ? teamLogoUrl(s.player.proTeam)
              : playerHeadshotUrl(s.player.playerId);
          const tooltip = `${s.player.name} — ${s.points} proj pts${
            s.positionRank > 0 ? ` (#${s.positionRank} of ${s.totalAtPosition} at ${s.axis})` : ""
          }`;
          return (
            <Tooltip
              key={s.slotLabel}
              label={tooltip}
              className="min-w-0 flex-1 cursor-default"
            >
              <div className={`text-[11px] font-bold sm:text-xs ${colors.text}`}>
                {s.positionRank > 0 ? `#${s.positionRank}` : "—"}
              </div>
              <div className={`mt-1 w-1/2 max-w-8 rounded-t ${colors.bar}`} style={{ height }} />
              <div className="mt-1">
                <PlayerAvatar src={avatarSrc} alt={s.player.name} />
              </div>
              <div className="mt-1 truncate text-center text-[10px] font-semibold text-neutral-500 sm:text-[11px]">
                {s.slotLabel}
              </div>
            </Tooltip>
          );
        })}
        {slots.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-500">No starters yet.</p>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        Bar height = {periodLabel} rank against other teams&apos; starter in that slot (RB1 vs.
        every other team&apos;s RB1, RB2 vs. their RB2, etc.) — #1 tallest, last place shortest.
      </p>
    </div>
  );
}
