"use client";

import { useState } from "react";
import PositionStrengthRadar from "./PositionStrengthRadar";
import StartingLineupChart from "./StartingLineupChart";
import type { PositionAxisRank, StarterRankInfo } from "@/lib/types";

// Holds the single Season/Wk N toggle state shared by both charts, so
// switching it in either one updates both at once.
export default function PositionCharts({
  seasonAxes,
  weekAxes,
  seasonLineup,
  weekLineup,
  currentWeek,
}: {
  seasonAxes: PositionAxisRank[];
  weekAxes: PositionAxisRank[];
  seasonLineup: StarterRankInfo[];
  weekLineup: StarterRankInfo[];
  currentWeek: number;
}) {
  const [mode, setMode] = useState<"season" | "week">("season");

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PositionStrengthRadar
        axes={mode === "season" ? seasonAxes : weekAxes}
        mode={mode}
        onModeChange={setMode}
        currentWeek={currentWeek}
      />
      <StartingLineupChart
        slots={mode === "season" ? seasonLineup : weekLineup}
        mode={mode}
        onModeChange={setMode}
        currentWeek={currentWeek}
      />
    </div>
  );
}
