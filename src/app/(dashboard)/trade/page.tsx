import { getDashboardData, getPlayerPool, getTeamWeeklyPoints } from "@/lib/data";
import { evaluateTrade, type TradeResult } from "@/lib/trade";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import TradeBuilder from "@/components/TradeBuilder";
import TradeResults from "@/components/TradeResults";
import type { RosterPlayer } from "@/lib/types";

// How many of the best free agents to consider for filling a roster
// spot an uneven trade opens up.
const FREE_AGENT_CANDIDATES = 20;

function parseIds(value: string | undefined, allowed: Set<number>): number[] {
  if (!value) return [];
  return [...new Set(value.split(",").map(Number))].filter((id) => allowed.has(id));
}

export default async function TradePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; ga?: string; gb?: string }>;
}) {
  const sp = await searchParams;
  const { leagues, isDemoData, errors } = await getDashboardData();
  const league = leagues[0] ?? null;

  if (!league || league.teams.length < 2) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {isDemoData && <DemoBanner />}
        <ErrorBanner errors={errors} />
        <h2 className="mb-2 text-xl font-semibold">Trade Analyzer</h2>
        <p className="text-sm text-neutral-500">
          No league data available. Check the error banner above and your environment configuration.
        </p>
      </div>
    );
  }

  const teams = [...league.teams].sort((x, y) => x.name.localeCompare(y.name));
  const teamA = teams.find((t) => t.id === Number(sp.a)) ?? teams[0];
  const teamB = teams.find((t) => t.id === Number(sp.b) && t.id !== teamA.id) ??
    teams.find((t) => t.id !== teamA.id)!;
  const ga = parseIds(sp.ga, new Set(teamA.roster.map((p) => p.playerId)));
  const gb = parseIds(sp.gb, new Set(teamB.roster.map((p) => p.playerId)));

  let result: TradeResult | null = null;
  const pageErrors = [...errors];

  if (ga.length > 0 && gb.length > 0) {
    // Free agents only matter when one side gets more players than it
    // sends, so skip the (large, uncached) player-pool fetch otherwise.
    let freeAgents: RosterPlayer[] = [];
    if (ga.length !== gb.length) {
      const { players, error } = await getPlayerPool(leagues, isDemoData);
      if (error) pageErrors.push({ leagueName: "Free agents", message: error });
      freeAgents = players
        .filter((p) => !p.isRostered && p.injuryStatus !== "IR" && p.injuryStatus !== "O")
        .sort((x, y) => y.projectedPoints - x.projectedPoints)
        .slice(0, FREE_AGENT_CANDIDATES)
        .map((p) => ({
          playerId: p.playerId,
          name: p.name,
          position: p.position,
          isFlexEligible: p.isFlexEligible,
          proTeam: p.proTeam,
          lineupSlot: "Bench",
          injuryStatus: p.injuryStatus,
          seasonPoints: p.seasonPoints,
          projectedPoints: p.projectedPoints,
          avgPoints: p.avgPoints,
        }));
    }

    const playerIds = [
      ...league.teams.flatMap((t) => t.roster.map((p) => p.playerId)),
      ...freeAgents.map((p) => p.playerId),
    ];
    const { points: weekly, error } = await getTeamWeeklyPoints(
      league.leagueId,
      playerIds,
      league.currentWeek,
      isDemoData
    );
    if (error) pageErrors.push({ leagueName: "Weekly stats", message: error });

    result = evaluateTrade(
      league,
      { teamAId: teamA.id, teamBId: teamB.id, aSends: ga, bSends: gb },
      weekly,
      freeAgents
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={pageErrors} />

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Trade Analyzer</h2>
        <p className="text-sm text-neutral-500">
          Pick two teams and the players each side sends. The trade is in the page link, so you
          can share it.
        </p>
      </div>

      <TradeBuilder
        teams={teams.map((t) => ({ id: t.id, name: t.name, roster: t.roster }))}
        a={teamA.id}
        b={teamB.id}
        ga={ga}
        gb={gb}
      />

      {result ? (
        <TradeResults result={result} currentWeek={league.currentWeek} />
      ) : (
        <p className="mb-6 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Select at least one player from each team to see the analysis.
        </p>
      )}

      <p className="pb-2 text-xs text-neutral-400">
        ROS = ESPN&apos;s rest-of-season projection ({league.totalWeeks - league.currentWeek + 1}{" "}
        weeks left, including this one). Before and after both use each team&apos;s best possible
        lineup by projection, not the lineup currently set. Power score and position ranks are the
        same ones the Compare page uses. Expert rankings and playoff schedules aren&apos;t included
        yet.
      </p>
    </div>
  );
}
