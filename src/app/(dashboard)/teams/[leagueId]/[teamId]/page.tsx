import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDashboardData,
  getStartingLineupRanks,
  getTeamPositionStrength,
  getTeamWeeklyPoints,
} from "@/lib/data";
import { playerHeadshotUrl, starterSlotSortIndex, teamLogoUrl } from "@/lib/constants";
import PlayerAvatar from "@/components/PlayerAvatar";
import WeekSelector from "@/components/WeekSelector";
import PositionCharts from "@/components/PositionCharts";
import { ErrorBanner } from "@/components/DemoBanner";
import AwardBadges from "@/components/AwardBadges";
import TradeNeedsCard from "@/components/TradeNeedsCard";
import TeamFreeAgents, { TeamFreeAgentsLoading } from "@/components/TeamFreeAgents";
import { getBestFits, getLeagueNeeds } from "@/lib/tradeNeeds";
import type { RosterPlayer, WeeklyPoints } from "@/lib/types";

function PlayerRow({ player, weekly }: { player: RosterPlayer; weekly: WeeklyPoints }) {
  const avatarSrc =
    player.position === "D/ST" ? teamLogoUrl(player.proTeam) : playerHeadshotUrl(player.playerId);

  return (
    <tr className="border-t border-neutral-100 bg-white dark:border-neutral-900 dark:bg-neutral-900">
      <td className="px-3 py-2 align-middle text-xs font-medium text-neutral-500">
        {player.lineupSlot}
      </td>
      <td className="px-3 py-2 align-middle">
        <div className="flex items-center gap-3">
          <PlayerAvatar src={avatarSrc} alt={player.name} />
          <div>
            <div className="font-medium text-blue-700 dark:text-blue-400">
              {player.name}
              {player.injuryStatus && (
                <span className="ml-1.5 rounded bg-red-100 px-1 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                  {player.injuryStatus}
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500">
              {player.proTeam} <span className="font-semibold">{player.position}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-right align-middle tabular-nums text-neutral-500">
        {weekly.projected}
      </td>
      {/* Season-wide average per game -- intentionally NOT tied to the
          selected week, per the week selector's purpose (it's a filter on
          which week's score shows, not a time-travel to that week's
          season-to-date average). */}
      <td className="px-3 py-2 text-right align-middle tabular-nums text-neutral-500">
        {player.avgPoints || "—"}
      </td>
      <td className="px-3 py-2 text-right align-middle tabular-nums">{weekly.points}</td>
    </tr>
  );
}

// The starters' Proj/Pts summed -- i.e. the team's live running total for
// the selected week, computed the same way the roster page already gets
// each player's actual points (not ESPN's own record.pointsFor, which
// stays frozen at 0 until ESPN closes out the whole scoring period, well
// after individual games -- and therefore player stats -- have updated).
// Deliberately kept off the Standings page, which shows ESPN's official
// number instead.
function TotalRow({ totalProj, totalPts }: { totalProj: number; totalPts: number }) {
  return (
    <tr className="border-t-2 border-neutral-300 bg-neutral-50 font-semibold dark:border-neutral-700 dark:bg-neutral-800/60">
      <td colSpan={2} className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300">
        Total
      </td>
      <td className="px-3 py-2 text-right align-middle tabular-nums text-neutral-700 dark:text-neutral-300">
        {totalProj}
      </td>
      <td className="px-3 py-2" />
      <td className="px-3 py-2 text-right align-middle tabular-nums text-neutral-900 dark:text-neutral-100">
        {totalPts}
      </td>
    </tr>
  );
}

function GroupDivider({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="border-t border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900"
      >
        {label}
      </td>
    </tr>
  );
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string; teamId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { leagueId, teamId } = await params;
  const sp = await searchParams;
  const { leagues, isDemoData } = await getDashboardData();

  const league = leagues.find((l) => l.leagueId === leagueId);
  const team = league?.teams.find((t) => String(t.id) === teamId);

  if (!league || !team) {
    notFound();
  }

  const requested = Number(sp.week);
  const week = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), league.totalWeeks)
    : league.currentWeek;

  const { points: weeklyPoints, error: weeklyError } = await getTeamWeeklyPoints(
    league.leagueId,
    team.roster.map((p) => p.playerId),
    week,
    isDemoData
  );
  const emptyWeekly: WeeklyPoints = { points: 0, projected: 0 };

  // For the charts' shared Season/Wk N toggle: one league-wide weekly
  // fetch (every rostered player, not just this team) covers both
  // getTeamPositionStrength's and getStartingLineupRanks's week mode.
  const allPlayerIds = league.teams.flatMap((t) => t.roster.map((p) => p.playerId));
  const { points: chartWeeklyPoints, error: chartError } = await getTeamWeeklyPoints(
    league.leagueId,
    allPlayerIds,
    league.currentWeek,
    isDemoData
  );

  const { axes: seasonAxes } = getTeamPositionStrength(league, team.id, "season", null);
  const { axes: weekAxes } = getTeamPositionStrength(
    league,
    team.id,
    league.currentWeek,
    chartWeeklyPoints
  );
  const seasonLineup = getStartingLineupRanks(league, team.id, null);
  const weekLineup = getStartingLineupRanks(league, team.id, chartWeeklyPoints);

  const starters = team.roster
    .filter((p) => p.lineupSlot !== "Bench" && p.lineupSlot !== "IR")
    .sort((a, b) => starterSlotSortIndex(a.lineupSlot) - starterSlotSortIndex(b.lineupSlot));
  const bench = team.roster.filter((p) => p.lineupSlot === "Bench");
  const ir = team.roster.filter((p) => p.lineupSlot === "IR");

  const totalProj =
    Math.round(
      starters.reduce((sum, p) => sum + (weeklyPoints.get(p.playerId)?.projected ?? 0), 0) * 10
    ) / 10;
  const totalPts =
    Math.round(
      starters.reduce((sum, p) => sum + (weeklyPoints.get(p.playerId)?.points ?? 0), 0) * 10
    ) / 10;

  const leagueNeeds = getLeagueNeeds(league);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <Link
        href="/teams"
        className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← Teams
      </Link>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{team.name}</h2>
          <p className="text-sm text-neutral-500">
            {team.ownerNames.length > 0 ? team.ownerNames.join(", ") : "Unknown owner"} ·{" "}
            {league.name}
          </p>
        </div>
        <div className="flex-1 sm:px-4">
          <AwardBadges teamName={team.name} />
        </div>
        <p className="whitespace-nowrap text-sm text-neutral-500">
          {team.wins}-{team.losses}
          {team.ties ? `-${team.ties}` : ""}
          {team.draftPosition && <> · Draft #{team.draftPosition}</>}
        </p>
      </div>

      {weeklyError && <ErrorBanner errors={[{ leagueName: "Weekly stats", message: weeklyError }]} />}
      {chartError && <ErrorBanner errors={[{ leagueName: "Position strength", message: chartError }]} />}

      <PositionCharts
        seasonAxes={seasonAxes}
        weekAxes={weekAxes}
        seasonLineup={seasonLineup}
        weekLineup={weekLineup}
        currentWeek={league.currentWeek}
      />

      <TradeNeedsCard needs={leagueNeeds.get(team.id)!} fits={getBestFits(leagueNeeds, team.id)} />

      <Suspense fallback={<TeamFreeAgentsLoading />}>
        <TeamFreeAgents
          leagues={leagues}
          league={league}
          teamId={team.id}
          needs={leagueNeeds.get(team.id)}
          isDemoData={isDemoData}
        />
      </Suspense>

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-neutral-500">
          Proj/Pts are for the selected week; Avg/Gm covers the whole season.
        </p>
        <WeekSelector week={week} totalWeeks={league.totalWeeks} />
      </div>

      <div className="mx-auto max-w-3xl overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2">Slot</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2 text-right">Wk {week} Proj</th>
              <th className="px-3 py-2 text-right">Avg/Gm</th>
              <th className="px-3 py-2 text-right">Wk {week} Pts</th>
            </tr>
          </thead>
          <tbody>
            {starters.map((p) => (
              <PlayerRow
                key={p.playerId}
                player={p}
                weekly={weeklyPoints.get(p.playerId) ?? emptyWeekly}
              />
            ))}
            {starters.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                  No players here.
                </td>
              </tr>
            )}
            {starters.length > 0 && <TotalRow totalProj={totalProj} totalPts={totalPts} />}

            {bench.length > 0 && (
              <>
                <GroupDivider label={`Bench (${bench.length})`} />
                {bench.map((p) => (
                  <PlayerRow
                    key={p.playerId}
                    player={p}
                    weekly={weeklyPoints.get(p.playerId) ?? emptyWeekly}
                  />
                ))}
              </>
            )}

            {ir.length > 0 && (
              <>
                <GroupDivider label={`IR (${ir.length})`} />
                {ir.map((p) => (
                  <PlayerRow
                    key={p.playerId}
                    player={p}
                    weekly={weeklyPoints.get(p.playerId) ?? emptyWeekly}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
