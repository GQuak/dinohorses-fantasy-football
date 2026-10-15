import PlayerAvatar from "./PlayerAvatar";
import Tooltip from "./Tooltip";
import ModeToggle from "./ModeToggle";
import { playerHeadshotUrl, teamLogoUrl, starterSlotSortIndex } from "@/lib/constants";
import { rankFraction } from "@/lib/rank";
import { COMPARE_COLORS, type CompareTeamColor } from "@/lib/compareColors";
import type { StarterRankInfo } from "@/lib/types";

// Same scale as StartingLineupChart -- keeping it identical means a #1
// rank draws the same bar height on both pages, not just the same
// fraction-of-container.
const MAX_BAR_HEIGHT = 140;

// Merges two teams' starter lists into one ordered list of slots, keyed by
// slotLabel (QB, RB1, RB2, ...). Teams normally share the exact same set of
// slot labels (same league-wide roster settings), but this tolerates a
// team missing a slot the other has, rather than assuming they line up.
function mergeSlots(
  a: StarterRankInfo[],
  b: StarterRankInfo[]
): { slotLabel: string; a: StarterRankInfo | null; b: StarterRankInfo | null }[] {
  const bySlotA = new Map(a.map((s) => [s.slotLabel, s]));
  const bySlotB = new Map(b.map((s) => [s.slotLabel, s]));
  const labels = Array.from(new Set([...bySlotA.keys(), ...bySlotB.keys()])).sort((x, y) => {
    const orderDiff =
      starterSlotSortIndex(x.replace(/\d+$/, "")) - starterSlotSortIndex(y.replace(/\d+$/, ""));
    return orderDiff !== 0 ? orderDiff : x.localeCompare(y);
  });
  return labels.map((slotLabel) => ({
    slotLabel,
    a: bySlotA.get(slotLabel) ?? null,
    b: bySlotB.get(slotLabel) ?? null,
  }));
}

// One team's bar within a slot -- same rank-label/bar/avatar stack as
// StartingLineupChart's single bar, just narrower (w-5 instead of w-8) so
// two fit where one used to.
function MiniBar({
  info,
  color,
  height,
}: {
  info: StarterRankInfo | null;
  color: CompareTeamColor;
  height: number;
}) {
  if (!info) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <div className="text-[11px] font-bold text-neutral-300 dark:text-neutral-700">—</div>
        <div
          className="mt-1 w-1/2 max-w-5 rounded-t bg-neutral-100 dark:bg-neutral-800"
          style={{ height: 6 }}
        />
        <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  const avatarSrc =
    info.player.position === "D/ST" ? teamLogoUrl(info.player.proTeam) : playerHeadshotUrl(info.player.playerId);
  const tooltip = `${info.player.name} — ${info.points} proj pts${
    info.positionRank > 0 ? ` (#${info.positionRank} of ${info.totalAtPosition} at ${info.axis})` : ""
  }`;

  return (
    <Tooltip label={tooltip} className="min-w-0 flex-1 cursor-default">
      <div className={`text-[11px] font-bold ${color.text}`}>
        {info.positionRank > 0 ? `#${info.positionRank}` : "—"}
      </div>
      <div className={`mt-1 w-1/2 max-w-5 rounded-t ${color.bar}`} style={{ height }} />
      <div className="mt-1">
        <PlayerAvatar src={avatarSrc} alt={info.player.name} />
      </div>
    </Tooltip>
  );
}

// Two-series version of StartingLineupChart: each slot draws a Team A bar
// and a Team B bar side by side instead of one, both scaled the same way
// (rank within the slot's pool, #1 tallest). Uses the exact same row
// mechanic as StartingLineupChart -- flex-1/min-w-0 slots that shrink to
// fit, no horizontal scroll -- rather than a fixed-width scrolling row.
// That scroll approach was tried here first and had a real bug: giving a
// row overflow-x:auto also makes the browser compute its overflow-y as
// "auto" (CSS couples the two whenever one is set to something other than
// "visible"), which silently clipped this chart's hover tooltips whenever
// a #1 or #2 rank's tall bar pushed one into that zone. Matching the
// single-team page's actual layout mechanism avoids that bug entirely
// instead of papering over it.
export default function CompareLineupChart({
  slotsA,
  slotsB,
  labelA,
  labelB,
  mode,
  onModeChange,
  currentWeek,
}: {
  slotsA: StarterRankInfo[];
  slotsB: StarterRankInfo[];
  labelA: string;
  labelB: string;
  mode: "season" | "week";
  onModeChange: (mode: "season" | "week") => void;
  currentWeek: number;
}) {
  const merged = mergeSlots(slotsA, slotsB);
  const periodLabel = mode === "season" ? "season" : `week ${currentWeek}`;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Starting Lineup</h3>
        <ModeToggle mode={mode} onChange={onModeChange} currentWeek={currentWeek} />
      </div>
      <div className="flex items-end justify-between gap-0.5">
        {merged.map(({ slotLabel, a, b }) => {
          const heightA = a
            ? Math.max(6, rankFraction(a.positionRank, a.totalAtPosition) * MAX_BAR_HEIGHT)
            : 6;
          const heightB = b
            ? Math.max(6, rankFraction(b.positionRank, b.totalAtPosition) * MAX_BAR_HEIGHT)
            : 6;
          return (
            <div key={slotLabel} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-end justify-center gap-0.5">
                <MiniBar info={a} color={COMPARE_COLORS.a} height={heightA} />
                <MiniBar info={b} color={COMPARE_COLORS.b} height={heightB} />
              </div>
              <div className="mt-1 w-full truncate text-center text-[10px] font-semibold text-neutral-500 sm:text-[11px]">
                {slotLabel}
              </div>
            </div>
          );
        })}
        {merged.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-500">No starters yet.</p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${COMPARE_COLORS.a.dot}`} />
          <span className="max-w-[100px] truncate">{labelA}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${COMPARE_COLORS.b.dot}`} />
          <span className="max-w-[100px] truncate">{labelB}</span>
        </span>
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        Bar height = {periodLabel} rank against other teams&apos; starter in that slot (RB1 vs.
        every other team&apos;s RB1, RB2 vs. their RB2, etc.) — #1 tallest, last place shortest.
      </p>
    </div>
  );
}
