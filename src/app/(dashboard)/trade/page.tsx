import { getDashboardData, getPlayerPool, getTeamWeeklyPoints } from "@/lib/data";
import { evaluateTrade, type TradeResult } from "@/lib/trade";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import TradeBuilder from "@/components/TradeBuilder";
import TradeResults from "@/components/TradeResults";
import ProjectionSourceSwitch from "@/components/ProjectionSourceSwitch";
import TradePartners from "@/components/TradePartners";
import { findTradePartners } from "@/lib/tradeNeeds";
import {
  getSourceProjections,
  parseProjectionSource,
  projectionFor,
  PROJECTION_SOURCES,
  type SourceProjections,
} from "@/lib/projections";
import type { RosterPlayer } from "@/lib/types";

// How many of the best free agents (by ESPN) to re-project with the
// chosen source, and how many of those to consider for filling a roster
// spot an uneven trade opens up.
const FREE_AGENT_CANDIDATES = 40;
const FREE_AGENT_POOL = 20;

function parseIds(value: string | undefined, allowed: Set<number>): number[] {
  if (!value) return [];
  return [...new Set(value.split(",").map(Number))].filter((id) => allowed.has(id));
}

export default async function TradePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; ga?: string; gb?: string; src?: string }>;
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

  const source = parseProjectionSource(sp.src);
  let result: TradeResult | null = null;
  const pageErrors = [...errors];

  // Free agents only matter when one side gets more players than it
  // sends, so skip the (large, uncached) player-pool fetch otherwise.
  // Candidates are picked on ESPN's numbers, then re-projected below.
  let freeAgents: RosterPlayer[] = [];
  if (ga.length > 0 && gb.length > 0 && ga.length !== gb.length) {
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

  // Every source's rest-of-season number for every player on the page,
  // then the chosen source's number swapped in as projectedPoints -- the
  // trade math itself doesn't know or care which source it's using.
  const rostered = league.teams.flatMap((t) => t.roster);
  const { bySource, errors: sourceErrors } = isDemoData
    ? { bySource: new Map<number, SourceProjections>(), errors: [] }
    : await getSourceProjections(
        [...rostered, ...freeAgents],
        league.seasonYear,
        league.currentWeek,
        league.totalWeeks
      );
  for (const message of sourceErrors) pageErrors.push({ leagueName: "Projections", message });

  let fellBackCount = 0;
  const reproject = (p: RosterPlayer): RosterPlayer => {
    const values = bySource.get(p.playerId);
    if (!values) return p;
    const { points, fellBack } = projectionFor(values, source);
    if (fellBack && rostered.includes(p)) fellBackCount++;
    return { ...p, projectedPoints: points };
  };
  const projectedLeague = {
    ...league,
    teams: league.teams.map((t) => ({ ...t, roster: t.roster.map(reproject) })),
  };
  freeAgents = freeAgents
    .map(reproject)
    .sort((x, y) => y.projectedPoints - x.projectedPoints)
    .slice(0, FREE_AGENT_POOL);

  if (ga.length > 0 && gb.length > 0) {
    const playerIds = [
      ...rostered.map((p) => p.playerId),
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
      projectedLeague,
      { teamAId: teamA.id, teamBId: teamB.id, aSends: ga, bSends: gb },
      weekly,
      freeAgents
    );
  }

  const sourceLabel = PROJECTION_SOURCES.find((s) => s.id === source)!.label;
  const projectedTeams = [...projectedLeague.teams].sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={pageErrors} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Trade Analyzer</h2>
          <p className="text-sm text-neutral-500">
            Pick two teams and the players each side sends. The trade is in the page link, so you
            can share it.
          </p>
        </div>
        <ProjectionSourceSwitch source={source} />
      </div>
      {fellBackCount > 0 && (
        <p className="mb-3 text-xs text-neutral-500">
          {sourceLabel} doesn&apos;t project {fellBackCount} rostered player
          {fellBackCount === 1 ? "" : "s"}; their ESPN projection is used instead.
        </p>
      )}

      <TradeBuilder
        teams={projectedTeams.map((t) => ({ id: t.id, name: t.name, roster: t.roster }))}
        a={teamA.id}
        b={teamB.id}
        ga={ga}
        gb={gb}
        src={source}
      />

      {result ? (
        <TradeResults
          result={result}
          currentWeek={league.currentWeek}
          sourceLabel={sourceLabel}
          breakdown={Object.fromEntries(bySource)}
        />
      ) : ga.length === 0 && gb.length === 0 ? (
        <TradePartners
          teamId={teamA.id}
          teamName={teamA.name}
          suggestions={findTradePartners(projectedLeague, teamA.id)}
          source={source}
          sourceLabel={sourceLabel}
        />
      ) : (
        <p className="mb-6 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Select at least one player from each team to see the analysis.
        </p>
      )}

      <p className="pb-2 text-xs text-neutral-400">
        ROS = rest-of-season projection ({league.totalWeeks - league.currentWeek + 1} weeks left,
        including this one), currently from {sourceLabel}. Sleeper and CBS use full-PPR scoring like
        this league, but their kicker and defense scoring differs from ESPN&apos;s; Consensus
        averages whichever sources project each player. The Wk {league.currentWeek} view always
        uses ESPN&apos;s weekly projections. Before and after both use each team&apos;s best possible
        lineup by projection, not the lineup currently set; players who are out, on IR or
        suspended only start there when there&apos;s no healthy backup. Power score and position ranks are the
        same ones the Compare page uses. Expert rankings and playoff schedules aren&apos;t included
        yet.
      </p>
    </div>
  );
}
