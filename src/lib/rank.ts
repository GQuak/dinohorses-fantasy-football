// Shared by every rank-driven bar/radar visual (Position Strength, Starting
// Lineup, and the team-compare charts): converts a 1-based rank (1 = best)
// into a 0..1 fraction of full scale, so #1 always plots at the outer edge
// / tallest bar regardless of how spread out the underlying point values
// are. Rank 0 (no data) or an unknown pool size maps to 0.
export function rankFraction(rank: number, total: number): number {
  return rank > 0 && total > 0 ? (total - rank + 1) / total : 0;
}
