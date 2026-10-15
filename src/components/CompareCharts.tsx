"use client";

import { useState } from "react";
import CompareRadar from "./CompareRadar";
import CompareLineupChart from "./CompareLineupChart";
import PowerRankings from "./PowerRankings";
import type { PositionAxisRank, PowerRankingEntry, StarterRankInfo } from "@/lib/types";

// Holds the single Season/Wk N toggle state shared by both compare charts
// (same pattern as PositionCharts for the single-team page) and the Power
// Rankings table below them.
export default function CompareCharts({
  labelA,
  labelB,
  keyA,
  keyB,
  seasonAxesA,
  weekAxesA,
  seasonAxesB,
  weekAxesB,
  seasonLineupA,
  weekLineupA,
  seasonLineupB,
  weekLineupB,
  seasonRankings,
  weekRankings,
  currentWeek,
}: {
  labelA: string;
  labelB: string;
  keyA: string;
  keyB: string;
  seasonAxesA: PositionAxisRank[];
  weekAxesA: PositionAxisRank[];
  seasonAxesB: PositionAxisRank[];
  weekAxesB: PositionAxisRank[];
  seasonLineupA: StarterRankInfo[];
  weekLineupA: StarterRankInfo[];
  seasonLineupB: StarterRankInfo[];
  weekLineupB: StarterRankInfo[];
  seasonRankings: PowerRankingEntry[];
  weekRankings: PowerRankingEntry[];
  currentWeek: number;
}) {
  const [mode, setMode] = useState<"season" | "week">("season");

  return (
    <>
      {/* Radar stays compact (it's square, so extra width just goes to
          waste); the bar chart carries 2x the bars of the single-team page
          (both teams, side by side, per slot) and needs the room -- hence
          35/65 instead of an even split. Fractions (not percentages) so the
          gap between them isn't double-counted into the 100%. */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[35fr_65fr]">
        <CompareRadar
          axesA={mode === "season" ? seasonAxesA : weekAxesA}
          axesB={mode === "season" ? seasonAxesB : weekAxesB}
          labelA={labelA}
          labelB={labelB}
          mode={mode}
          onModeChange={setMode}
          currentWeek={currentWeek}
        />
        <CompareLineupChart
          slotsA={mode === "season" ? seasonLineupA : weekLineupA}
          slotsB={mode === "season" ? seasonLineupB : weekLineupB}
          labelA={labelA}
          labelB={labelB}
          mode={mode}
          onModeChange={setMode}
          currentWeek={currentWeek}
        />
      </div>
      <PowerRankings
        rankings={mode === "season" ? seasonRankings : weekRankings}
        keyA={keyA}
        keyB={keyB}
        mode={mode}
        currentWeek={currentWeek}
      />
    </>
  );
}
