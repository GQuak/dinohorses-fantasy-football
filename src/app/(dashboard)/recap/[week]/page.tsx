import { notFound } from "next/navigation";
import { getRecapByWeek, WEEKLY_RECAPS } from "@/lib/recapData";
import WeeklyRecapView from "@/components/WeeklyRecapView";

export default async function RecapWeekPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week: weekParam } = await params;
  const week = Number(weekParam);
  const recap = Number.isFinite(week) ? getRecapByWeek(week) : null;

  if (!recap) {
    notFound();
  }

  return <WeeklyRecapView recap={recap} allWeeks={WEEKLY_RECAPS.map((r) => r.week)} />;
}
