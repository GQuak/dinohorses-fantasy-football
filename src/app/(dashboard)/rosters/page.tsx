import { redirect } from "next/navigation";

// This page moved to /teams (renamed "Members & Rosters" -> "Teams").
// Kept as a redirect so any old bookmarks/links still work.
export default function RostersRedirect() {
  redirect("/teams");
}
